import { supabase } from '../lib/supabase';
import { fetchTrendingMovies, fetchTrendingSeries, fetchTopRatedGames, searchMedia, fetchGames } from './api';
import { getAIRecommendations } from './aiService';
import { useLanguageStore } from '@/store/useLanguageStore';

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

    const baseRecommendations: RecommendationItem[] = [];
    const maxLength = Math.max(trendingMovies.length, trendingSeries.length, topGames.length);
    
    for (let i = 0; i < maxLength; i++) {
      if (trendingMovies[i]) {
        baseRecommendations.push({
          external_id: trendingMovies[i].external_id,
          title: trendingMovies[i].title,
          poster_url: trendingMovies[i].poster_url,
          media_type: 'movie',
          rating_global: trendingMovies[i].rating || 0,
          reason: 'Trending Movie'
        });
      }
      if (trendingSeries[i]) {
        baseRecommendations.push({
          external_id: trendingSeries[i].external_id,
          title: trendingSeries[i].title,
          poster_url: trendingSeries[i].poster_url,
          media_type: 'series',
          rating_global: trendingSeries[i].rating || 0,
          reason: 'Trending Series'
        });
      }
      if (topGames[i]) {
        baseRecommendations.push({
          external_id: topGames[i].external_id,
          title: topGames[i].title,
          poster_url: topGames[i].poster_url,
          media_type: 'game',
          rating_global: topGames[i].rating || 0,
          reason: 'Top Rated Game'
        });
      }
    }

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

    // 4. Call Gemini API if we have enough data
    let aiRecs = { recommendations: [] as any[] };
    if (favoriteGenres.length > 0 || topRated.length > 0 || recentlyWatched.length > 0) {
      const lang = useLanguageStore.getState().language;
      console.log('Calling Gemini with:', { favoriteGenres, topRated, recentlyWatched, lang });
      aiRecs = await getAIRecommendations({
        favoriteGenres,
        topRated: topRated.slice(0, 10),
        recentlyWatched: recentlyWatched.slice(0, 10),
        language: lang
      });
      console.log('Gemini returned:', aiRecs);
    } else {
      console.log('Not enough data to call Gemini');
    }

    if (!aiRecs.recommendations || aiRecs.recommendations.length === 0) {
      console.log('Falling back to base recommendations');
      return deduplicate(baseRecommendations).filter(item => !userExternalIds.has(item.external_id)).slice(0, 20);
    }

    // 5. Fetch details for AI recommendations
    const personalizedRecs: RecommendationItem[] = [];
    
    await Promise.all(aiRecs.recommendations.map(async (rec) => {
      try {
        console.log('Fetching details for:', rec.title, rec.type);
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
          } else if (media.length > 0 && !userExternalIds.has(media[0].external_id)) {
             // Fallback if type doesn't match exactly but we found something
             personalizedRecs.push({
              external_id: media[0].external_id,
              title: media[0].title,
              poster_url: media[0].poster_url,
              media_type: media[0].media_type as 'movie' | 'series',
              rating_global: media[0].rating || 0,
              reason: rec.reason
            });
            userExternalIds.add(media[0].external_id);
          }
        }
      } catch (err) {
        console.error(`Error resolving details for ${rec.title}:`, err);
      }
    }));

    console.log('Personalized recs fetched:', personalizedRecs.length);

    // 6. Combine, filter out already in library, and deduplicate
    // Note: personalizedRecs were already checked against userExternalIds before being added to the array
    const filteredBase = baseRecommendations.filter(item => !userExternalIds.has(item.external_id));
    const combined = [...personalizedRecs, ...filteredBase];

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
