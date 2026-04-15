import { supabase } from '../lib/supabase';

const TMDB_API_KEY = import.meta.env.VITE_TMDB_API_KEY || '';
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

export interface Episode {
  id: number;
  name: string;
  episode_number: number;
  season_number: number;
  still_path: string | null;
  overview: string;
  air_date: string;
}

export interface Season {
  id: number;
  name: string;
  season_number: number;
  episode_count: number;
  poster_path: string | null;
  episodes?: Episode[];
}

export interface WatchedEpisode {
  user_id: string;
  media_id: string;
  season_number: number;
  episode_number: number;
  created_at?: string;
}

export interface SeasonRating {
  media_id: string;
  season_number: number;
  rating: number;
}

/**
 * Fetches all season ratings for a media item for the current user.
 */
export async function getSeasonRatings(mediaId: string): Promise<SeasonRating[]> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('season_ratings')
      .select('media_id, season_number, rating')
      .eq('user_id', user.id)
      .eq('media_id', mediaId);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error getting season ratings:', error);
    return [];
  }
}

/**
 * Saves a season rating to Supabase.
 */
export async function saveSeasonRating(mediaId: string, seasonNumber: number, rating: number) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Ensure mediaId is a valid UUID format (basic check)
    if (!mediaId || mediaId.length < 30) {
      console.error('Invalid mediaId for season rating:', mediaId);
      throw new Error('Invalid media ID');
    }

    const { error } = await supabase
      .from('season_ratings')
      .upsert({
        user_id: user.id,
        media_id: mediaId,
        season_number: seasonNumber,
        rating: rating,
        updated_at: new Date().toISOString()
      }, { 
        onConflict: 'user_id,media_id,season_number' 
      });

    if (error) {
      console.error('Supabase error saving season rating:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error saving season rating:', error);
    throw error;
  }
}

/**
 * Fetches all seasons for a TV series from TMDB.
 */
export async function fetchSeasons(externalId: string): Promise<{ seasons: Season[], number_of_episodes: number }> {
  if (!TMDB_API_KEY) return { seasons: [], number_of_episodes: 0 };
  const tmdbId = externalId.replace('tmdb_series_', '').replace('tmdb_movie_', '').replace('tmdb_', '');
  try {
    const res = await fetch(`${TMDB_BASE_URL}/tv/${tmdbId}?api_key=${TMDB_API_KEY}`);
    if (!res.ok) throw new Error('Failed to fetch series info');
    const data = await res.json();
    return {
      seasons: data.seasons || [],
      number_of_episodes: data.number_of_episodes || 0
    };
  } catch (error) {
    console.error('Error fetching seasons:', error);
    return { seasons: [], number_of_episodes: 0 };
  }
}

/**
 * Fetches episodes for a specific season from TMDB.
 */
export async function fetchSeasonEpisodes(externalId: string, seasonNumber: number): Promise<Episode[]> {
  if (!TMDB_API_KEY) return [];
  const tmdbId = externalId.replace('tmdb_series_', '').replace('tmdb_movie_', '').replace('tmdb_', '');
  try {
    const res = await fetch(`${TMDB_BASE_URL}/tv/${tmdbId}/season/${seasonNumber}?api_key=${TMDB_API_KEY}`);
    if (!res.ok) throw new Error('Failed to fetch season episodes');
    const data = await res.json();
    console.log(`TMDB Season ${seasonNumber} data:`, data);
    return data.episodes || [];
  } catch (error) {
    console.error('Error fetching season episodes:', error);
    return [];
  }
}

/**
 * Gets all watched episodes for a media item from Supabase.
 */
export async function getWatchedEpisodes(mediaId: string): Promise<WatchedEpisode[]> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('episode_progress')
      .select('*')
      .eq('user_id', user.id)
      .eq('media_id', mediaId);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error getting watched episodes:', error);
    return [];
  }
}

/**
 * Marks an episode as watched in Supabase.
 */
export async function markEpisodeWatched(mediaId: string, season: number, episode: number) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { error } = await supabase
      .from('episode_progress')
      .upsert({
        user_id: user.id,
        media_id: mediaId,
        season_number: season,
        episode_number: episode
      }, { onConflict: 'user_id,media_id,season_number,episode_number' });

    if (error) throw error;
  } catch (error) {
    console.error('Error marking episode watched:', error);
    throw error;
  }
}

/**
 * Unmarks an episode as watched in Supabase.
 */
export async function unmarkEpisodeWatched(mediaId: string, season: number, episode: number) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { error } = await supabase
      .from('episode_progress')
      .delete()
      .eq('user_id', user.id)
      .eq('media_id', mediaId)
      .eq('season_number', season)
      .eq('episode_number', episode);

    if (error) throw error;
  } catch (error) {
    console.error('Error unmarking episode watched:', error);
    throw error;
  }
}

/**
 * Marks an entire season as watched.
 */
export async function markSeasonWatched(mediaId: string, season: number, episodeCount: number) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const episodes = Array.from({ length: episodeCount }, (_, i) => ({
      user_id: user.id,
      media_id: mediaId,
      season_number: season,
      episode_number: i + 1
    }));

    const { error } = await supabase
      .from('episode_progress')
      .upsert(episodes, { onConflict: 'user_id,media_id,season_number,episode_number' });

    if (error) throw error;
  } catch (error) {
    console.error('Error marking season watched:', error);
    throw error;
  }
}

/**
 * Helper: Gets the last watched episode.
 */
export function getLastWatchedEpisode(watched: WatchedEpisode[]) {
  if (watched.length === 0) return null;
  return watched.reduce((prev, curr) => {
    if (curr.season_number > prev.season_number) return curr;
    if (curr.season_number === prev.season_number && curr.episode_number > prev.episode_number) return curr;
    return prev;
  });
}

/**
 * Helper: Gets progress for a specific season.
 */
export function getSeasonProgress(watched: WatchedEpisode[], seasonNumber: number, total: number) {
  const watchedInSeason = watched.filter(w => w.season_number === seasonNumber).length;
  return total > 0 ? (watchedInSeason / total) * 100 : 0;
}

/**
 * Helper: Gets total progress for the series.
 */
export function getTotalProgress(watched: WatchedEpisode[], seasons: Season[]) {
  const totalEpisodes = seasons.reduce((acc, s) => acc + s.episode_count, 0);
  if (totalEpisodes === 0) return 0;
  return (watched.length / totalEpisodes) * 100;
}
