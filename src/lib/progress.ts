import { Season, WatchedEpisode } from '@/services/episodes';
import { WatchlistItem } from '@/store/useStore';

export function calculateMediaProgress(
  item: WatchlistItem | undefined,
  watchedEpisodes: WatchedEpisode[],
  seasons: Season[]
): number {
  if (!item) return 0;

  if (item.media?.media_type === 'series') {
    const totalEpisodes = seasons.reduce((acc, s) => acc + s.episode_count, 0);
    if (totalEpisodes === 0) return 0;
    return (watchedEpisodes.length / totalEpisodes);
  }

  if (item.media?.media_type === 'game') {
    const targetPlaytime = item.media?.playtime || 100;
    return Math.min(1, (item.hours_played || 0) / targetPlaytime);
  }

  // Fallback
  return Math.min(1, (item.hours_played || 0) / 100);
}
