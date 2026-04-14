import { supabase } from '@/lib/supabase';
import { TMDB_API_KEY, TMDB_BASE_URL } from './api';

export interface Notification {
  id: string;
  user_id: string;
  media_id: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  poster_url?: string;
}

export const checkAndCreateNotifications = async (userId: string) => {
  if (!TMDB_API_KEY) return;

  try {
    // Fetch series in library with status 'watching' or 'planned'
    const { data: libraryItems, error } = await supabase
      .from('user_library')
      .select('*, media(*)')
      .eq('user_id', userId)
      .in('status', ['watching', 'planned']);

    if (error) throw error;

    const seriesItems = libraryItems?.filter(item => item.media?.media_type === 'series') || [];

    for (const item of seriesItems) {
      if (!item.media?.external_id?.startsWith('tmdb_series_')) continue;
      
      const tmdbId = item.media.external_id.replace('tmdb_series_', '');
      
      // Fetch TMDB details
      const res = await fetch(`${TMDB_BASE_URL}/tv/${tmdbId}?api_key=${TMDB_API_KEY}`);
      if (!res.ok) continue;
      const tvData = await res.json();

      const now = new Date();
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(now.getDate() + 30);
      
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(now.getDate() - 7);

      const notificationsToCreate = [];

      // Check next_episode_to_air
      if (tvData.next_episode_to_air && tvData.next_episode_to_air.air_date) {
        const airDate = new Date(tvData.next_episode_to_air.air_date);
        if (airDate >= now && airDate <= thirtyDaysFromNow) {
          notificationsToCreate.push({
            user_id: userId,
            media_id: item.media_id,
            title: tvData.name,
            message: `Season ${tvData.next_episode_to_air.season_number} premieres on ${airDate.toLocaleDateString()}`,
            poster_url: item.media.poster_url
          });
        }
      }

      // Check last_episode_to_air
      if (tvData.last_episode_to_air && tvData.last_episode_to_air.air_date) {
        const airDate = new Date(tvData.last_episode_to_air.air_date);
        if (airDate <= now && airDate >= sevenDaysAgo) {
          // Check if user has watched it
          const { data: watchedData } = await supabase
            .from('watched_episodes')
            .select('id')
            .eq('user_id', userId)
            .eq('media_id', item.media_id)
            .eq('season_number', tvData.last_episode_to_air.season_number)
            .eq('episode_number', tvData.last_episode_to_air.episode_number)
            .maybeSingle();

          if (!watchedData) {
            notificationsToCreate.push({
              user_id: userId,
              media_id: item.media_id,
              title: tvData.name,
              message: `New episode available: S${tvData.last_episode_to_air.season_number} E${tvData.last_episode_to_air.episode_number}`,
              poster_url: item.media.poster_url
            });
          }
        }
      }

      // Insert notifications if they don't exist
      for (const notif of notificationsToCreate) {
        // Check if notification already exists for this media and message
        const { data: existing } = await supabase
          .from('notifications')
          .select('id')
          .eq('user_id', userId)
          .eq('media_id', notif.media_id)
          .eq('message', notif.message)
          .maybeSingle();

        if (!existing) {
          await supabase.from('notifications').insert({
            user_id: notif.user_id,
            media_id: notif.media_id,
            title: notif.title,
            message: notif.message,
            poster_url: notif.poster_url
          });
        }
      }
    }
  } catch (error) {
    console.error('Error checking notifications:', error);
  }
};

export const getNotifications = async (userId: string) => {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
    
  if (error) {
    console.error('Error fetching notifications:', error);
    return [];
  }
  return data as Notification[];
};

export const markNotificationAsRead = async (id: string) => {
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', id);
    
  if (error) {
    console.error('Error marking notification as read:', error);
  }
};
