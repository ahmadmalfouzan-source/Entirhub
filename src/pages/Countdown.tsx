import React, { useEffect, useState } from 'react';
import { useStore, WatchlistItem } from '@/store/useStore';
import { fetchMediaDetails, MediaItem } from '@/services/api';
import { format, differenceInSeconds, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
import { CalendarDays, List, Timer, Bell, Play } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';

interface EpisodeItem {
  series: MediaItem;
  libraryItem: WatchlistItem;
  episode: any;
  airDate: Date | null;
  type: 'upcoming' | 'recent' | 'tba';
}

export function Countdown() {
  const { watchlist } = useStore();
  const [upcoming, setUpcoming] = useState<EpisodeItem[]>([]);
  const [view, setView] = useState<'list' | 'calendar'>('list');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      const seriesItems = watchlist.filter(
        (item) => item.media?.media_type === 'series' && 
                 (item.status === 'watching' || item.status === 'planned')
      );

      const episodes = await Promise.all(
        seriesItems.map(async (item) => {
          const rawExternalId = item.media?.external_id || '';
          const tmdbId = rawExternalId.replace('tmdb_series_', '').replace('tmdb_movie_', '').replace('tmdb_', '');
          
          if (!tmdbId || tmdbId.startsWith('rawg_')) return null;

          const details = await fetchMediaDetails(rawExternalId, 'series');
          if (details?.next_episode_to_air) {
            return {
              series: details,
              libraryItem: item,
              episode: details.next_episode_to_air,
              airDate: new Date(details.next_episode_to_air.air_date),
              type: 'upcoming' as const
            };
          } else if (details?.last_episode_to_air) {
            const airDate = new Date(details.last_episode_to_air.air_date);
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            if (airDate >= thirtyDaysAgo) {
              return {
                series: details,
                libraryItem: item,
                episode: details.last_episode_to_air,
                airDate: airDate,
                type: 'recent' as const
              };
            }
          }
          return {
            series: details as MediaItem,
            libraryItem: item,
            episode: null,
            airDate: null,
            type: 'tba' as const
          };
        })
      );

      const validEpisodes = episodes.filter((e): e is EpisodeItem => e !== null);
      setUpcoming(validEpisodes.sort((a, b) => {
        if (!a.airDate) return 1;
        if (!b.airDate) return -1;
        return a.airDate.getTime() - b.airDate.getTime();
      }));
      setLoading(false);
    };

    loadData();
  }, [watchlist]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#030308] p-6 pt-20 space-y-6">
        <div className="h-10 w-48 bg-white/5 rounded-full animate-pulse" />
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-48 rounded-[32px] bg-white/5 animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#030308] pb-24 animate-in fade-in duration-500">
      <div className="sticky top-0 z-[80] bg-[#030308]/80 backdrop-blur-xl border-b border-white/5 px-6 py-4 flex items-center justify-between">
        <div className="flex flex-col">
          <span className="text-[10px] font-black text-primary tracking-[0.2em] uppercase">AUTO-TRACKED</span>
          <h1 className="text-2xl font-black text-white italic">UPCOMING<span className="text-primary italic-none">.</span></h1>
        </div>
        <div className="flex bg-white/5 p-1 rounded-2xl border border-white/5">
          <button 
            onClick={() => setView('list')}
            className={`p-2 rounded-xl transition-all ${view === 'list' ? 'bg-primary text-white shadow-lg' : 'text-gray-500'}`}
          >
            <List className="w-4 h-4" />
          </button>
          <button 
            onClick={() => setView('calendar')}
            className={`p-2 rounded-xl transition-all ${view === 'calendar' ? 'bg-primary text-white shadow-lg' : 'text-gray-500'}`}
          >
            <CalendarDays className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="px-6 py-8 space-y-8">
        <AnimatePresence>
          {upcoming.map((item, idx) => (
            <motion.div 
              key={`${item.series.external_id}-${item.episode?.id || idx}`}
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: idx * 0.05 }}
              onClick={() => navigate(`/content/${item.series.external_id}`)}
              className="premium-glass p-6 rounded-[32px] border border-white/5 flex gap-5 items-center group active:scale-[0.98] transition-all relative overflow-hidden"
            >
              {item.type === 'upcoming' && (
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 blur-[40px] rounded-full translate-x-1/2 -translate-y-1/2" />
              )}
              
              <div className="relative shrink-0">
                <img src={item.series.poster_url} className="w-20 h-28 rounded-2xl object-cover shadow-xl border border-white/5" alt="" />
                {item.type === 'upcoming' && (
                  <div className="absolute -top-2 -right-2 w-8 h-8 rounded-xl bg-primary text-white flex items-center justify-center shadow-lg border-2 border-[#030308]">
                    <Bell className="w-4 h-4" />
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0 space-y-2">
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-black uppercase tracking-widest ${item.type === 'upcoming' ? 'text-primary' : 'text-gray-500'}`}>
                    {item.type === 'upcoming' ? 'Airing Soon' : item.type === 'recent' ? 'Recently Aired' : 'TBA'}
                  </span>
                </div>
                <h2 className="text-lg font-black text-white leading-tight truncate">{item.series.title}</h2>
                <div className="space-y-1">
                  <p className="text-sm font-bold text-gray-400 group-hover:text-primary transition-colors truncate">
                    {item.episode ? `S${item.episode.season_number} E${item.episode.episode_number}: ${item.episode.name}` : 'Next Episode Date Unset'}
                  </p>
                  <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest">
                    {item.airDate ? format(item.airDate, 'EEEE, MMM do, yyyy') : 'No Date Linked'}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {upcoming.length === 0 && (
        <div className="py-20 flex flex-col items-center justify-center text-center px-12 space-y-6 opacity-40">
          <Timer className="w-16 h-16 text-gray-600" />
          <div className="space-y-2">
            <h3 className="text-lg font-black text-white italic">Nothing is Airing Soon</h3>
            <p className="text-sm text-gray-500 font-medium">Add more series to your "Currently Watching" list to track upcoming episodes.</p>
          </div>
          <button 
            onClick={() => navigate('/home')}
            className="px-8 h-12 bg-white/5 border border-white/10 rounded-full font-black text-[10px] uppercase tracking-widest text-white active:scale-95 transition-all"
          >
            Discover Content
          </button>
        </div>
      )}
    </div>
  );
}
