import { supabase } from '../lib/supabase';
import { fetchTrendingMovies, fetchTrendingSeries, fetchTopRatedGames } from './api';

export interface RecommendationItem {
  id?: string;
  external_id: string;
  title: string;
  poster_url: string;
  media_type: 'movie' | 'series' | 'game';
  rating_global: number;
}

/**
 * Generates personalized recommendations based on user's library history.
 * Combines Supabase genre matching with TMDB/RAWG trending for variety.
 */
export async function getRecommendations(): Promise<RecommendationItem[]> {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    // 1. Fetch trending items as a base for variety
    const [trendingMovies, trendingSeries, topGames] = await Promise.all([
      fetchTrendingMovies(),
      fetchTrendingSeries(),
      fetchTopRatedGames()
    ]);

    const baseRecommendations: RecommendationItem[] = [
      ...trendingMovies.map(m => ({ ...m, rating_global: m.rating || 0 })),
      ...trendingSeries.map(s => ({ ...s, rating_global: s.rating || 0 })),
      ...topGames.map(g => ({ ...g, rating_global: g.rating || 0 }))
    ].map(item => ({
      external_id: item.external_id,
      title: item.title,
      poster_url: item.poster_url,
      media_type: item.media_type as any,
      rating_global: item.rating_global
    }));

    if (authError || !user) {
      return deduplicate(baseRecommendations).slice(0, 20);
    }

    // 2. Fetch user's highly rated or completed media for personalization
    const { data: libraryItems, error: libError } = await supabase
      .from('user_library')
      .select('media_id, media(genres, external_id)')
      .eq('user_id', user.id)
      .or('status.eq.completed,rating.gte.4');

    if (libError || !libraryItems || libraryItems.length === 0) {
      return deduplicate(baseRecommendations).slice(0, 20);
    }

    // 3. Extract genres and existing IDs
    const genreCounts: Record<string, number> = {};
    const userExternalIds = new Set<string>();

    libraryItems.forEach((item: any) => {
      if (item.media?.external_id) userExternalIds.add(item.media.external_id);
      const genres = item.media?.genres || [];
      genres.forEach((genre: string) => {
        genreCounts[genre] = (genreCounts[genre] || 0) + 1;
      });
    });

    // 4. Get top genres
    const topGenres = Object.entries(genreCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([genre]) => genre);

    // 5. Query Supabase for similar items based on genres
    let personalizedRecs: RecommendationItem[] = [];
    if (topGenres.length > 0) {
      const { data: supabaseRecs } = await supabase
        .from('media')
        .select('id, external_id, title, poster_url, media_type, rating_global')
        .overlaps('genres', topGenres)
        .order('rating_global', { ascending: false })
        .limit(30);

      if (supabaseRecs) {
        personalizedRecs = supabaseRecs.map(item => ({
          id: item.id,
          external_id: item.external_id,
          title: item.title,
          poster_url: item.poster_url,
          media_type: item.media_type as any,
          rating_global: item.rating_global || 0
        }));
      }
    }

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
