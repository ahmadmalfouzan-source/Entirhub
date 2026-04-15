import { supabase } from '../lib/supabase';
import { fetchTrendingMovies, fetchTrendingSeries, fetchTopRatedGames, searchMedia, fetchGames } from './api';
import { getAIRecommendations } from './aiService';

export interface RecommendationItem {
  id?: string;
  external_id: string;
  title: string;
  poster_url: string;
  media_type: 'movie' | 'series' | 'game';
  rating_global: number;
  reason?: string;
}

/**
 * Generates personalized recommendations based on user's library history.
 * Uses Gemini API for smart recommendations and fetches details from TMDB/RAWG.
 */
export async function getRecommendations(): Promise<RecommendationItem[]> {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    // 1. Fetch trending items as a base for variety (fallback)
    const [trendingMovies, trendingSeries, topGames] = await Promise.all([
      fetchTrendingMovies(),
      fetchTrendingSeries(),
      fetchTopRatedGames()
    ]);

    const baseRecommendations: RecommendationItem[] = [
      ...trendingMovies.map(m => ({ ...m, rating_global: m.rating || 0, reason: 'Trending Movie' })),
      ...trendingSeries.map(s => ({ ...s, rating_global: s.rating || 0, reason: 'Trending Series' })),
      ...topGames.map(g => ({ ...g, rating_global: g.rating || 0, reason: 'Top Rated Game' }))
    ].map(item => ({
      external_id: item.external_id,
      title: item.title,
      poster_url: item.poster_url,
      media_type: item.media_type as any,
      rating_global: item.rating_global,
      reason: item.reason
    }));

    if (authError || !user) {
      return deduplicate(baseRecommendations).slice(0, 20);
    }

    // 2. Fetch user's library for personalization
    const { data: libraryItems, error: libError } = await supabase
      .from('user_library')
      .select('media_id, rating, status, media(title, genres, external_id, media_type)')
      .eq('user_id', user.id);

    if (libError || !libraryItems || libraryItems.length === 0) {
      return deduplicate(baseRecommendations).slice(0, 20);
    }

    // 3. Extract data for Gemini
    const userExternalIds = new Set<string>();
    const genreCounts: Record<string, number> = {};
    const topRated: string[] = [];
    const recentlyWatched: string[] = [];

    libraryItems.forEach((item: any) => {
      if (item.media?.external_id) userExternalIds.add(item.media.external_id);
      
      const title = item.media?.title;
      if (!title) return;

      if (item.rating >= 4) {
        topRated.push(title);
      }
      if (item.status === 'watching' || item.status === 'completed') {
        recentlyWatched.push(title);
      }

      const genres = item.media?.genres || [];
      genres.forEach((genre: string) => {
        genreCounts[genre] = (genreCounts[genre] || 0) + 1;
      });
    });

    const favoriteGenres = Object.entries(genreCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([genre]) => genre);

    // 4. Call Gemini API
    const aiRecs = await getAIRecommendations({
      favoriteGenres,
      topRated: topRated.slice(0, 10),
      recentlyWatched: recentlyWatched.slice(0, 10)
    });

    if (!aiRecs.recommendations || aiRecs.recommendations.length === 0) {
      return deduplicate(baseRecommendations).filter(item => !userExternalIds.has(item.external_id)).slice(0, 20);
    }

    // 5. Fetch details for AI recommendations
    const personalizedRecs: RecommendationItem[] = [];
    
    await Promise.all(aiRecs.recommendations.map(async (rec) => {
      try {
        if (rec.type === 'game') {
          const games = await fetchGames(rec.title);
          if (games && games.length > 0) {
            const game = games[0];
            if (!userExternalIds.has(game.external_id)) {
              personalizedRecs.push({
                external_id: game.external_id,
                title: game.title,
                poster_url: game.poster_url,
                media_type: 'game',
                rating_global: game.rating || 0,
                reason: rec.reason
              });
              userExternalIds.add(game.external_id);
            }
          }
        } else {
          const media = await searchMedia(rec.title);
          const match = media.find(m => m.media_type === rec.type);
          if (match && !userExternalIds.has(match.external_id)) {
            personalizedRecs.push({
              external_id: match.external_id,
              title: match.title,
              poster_url: match.poster_url,
              media_type: match.media_type as 'movie' | 'series',
              rating_global: match.rating || 0,
              reason: rec.reason
            });
            userExternalIds.add(match.external_id);
          }
        }
      } catch (err) {
        console.error(`Failed to fetch details for ${rec.title}:`, err);
      }
    }));

    // 6. Combine, filter out already in library, and deduplicate
    const combined = [...personalizedRecs, ...baseRecommendations]
      .filter(item => !userExternalIds.has(item.external_id));

    return deduplicate(combined).slice(0, 20);
  } catch (error) {
    console.error('Error getting recommendations:', error);
    return [];
  }
}

/**
 * Deduplicates items by external_id
 */
function deduplicate(items: RecommendationItem[]): RecommendationItem[] {
  const seen = new Set();
  return items.filter(item => {
    if (seen.has(item.external_id)) return false;
    seen.add(item.external_id);
    return true;
  });
}
