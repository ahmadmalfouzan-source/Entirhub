import React, { useEffect, useState } from 'react';
import { useStore, WatchlistItem } from '@/store/useStore';
import { fetchMediaDetails, MediaItem } from '@/services/api';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { format, differenceInSeconds, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth } from 'date-fns';
import { CalendarDays, List } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';

interface EpisodeItem {
  series: MediaItem;
  libraryItem: WatchlistItem;
  episode: any;
  airDate: Date | null;
  type: 'upcoming' | 'recent' | 'tba';
}

export function Countdown() {
  const { watchlist, updateWatchlistItem } = useStore();
  const [upcoming, setUpcoming] = useState<EpisodeItem[]>([]);
  const [view, setView] = useState<'list' | 'calendar'>('list');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkNotifications = async (episodes: EpisodeItem[]) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const now = new Date();
      for (const item of episodes) {
        if (item.airDate && item.airDate > now && differenceInSeconds(item.airDate, now) < 86400) {
          try {
            const { error } = await supabase.from('notifications').insert({
              user_id: user.id,
              message: `New episode of ${item.series.title} airs soon!`,
              type: 'countdown'
            });
            if (error) {
              console.error('Error inserting notification:', error);
            } else {
              toast.info(`New episode of ${item.series.title} airs soon!`);
            }
          } catch (e) {
            console.error('Unexpected error checking notifications:', e);
          }
        }
      }
    };

    const loadData = async () => {
      setLoading(true);
      console.log('Starting data fetch, watchlist:', watchlist);
      
      const seriesItems = watchlist.filter(
        (item) => item.media?.media_type === 'series' && 
                 (item.status === 'watching' || item.status === 'planned')
      );
      console.log('Filtering seriesItems:', seriesItems);

      const episodes = await Promise.all(
        seriesItems.map(async (item) => {
          const rawExternalId = item.media?.external_id || '';
          const tmdbId = rawExternalId.replace('tmdb_series_', '').replace('tmdb_movie_', '').replace('tmdb_', '');
          console.log(`[Countdown Debug] Raw External ID: ${rawExternalId}, Stripped TMDB ID: ${tmdbId}`);
          
          if (!tmdbId || tmdbId.startsWith('rawg_')) {
            console.log(`[Countdown Debug] Skipping non-TMDB item: ${item.media?.title}`);
            return null;
          }

          const details = await fetchMediaDetails(rawExternalId, 'series');
          console.log(`[Countdown Debug] Fetched details for ${item.media?.title}:`, details);
          
          if (details?.next_episode_to_air) {
            console.log(`[Countdown Debug] Found next episode for ${details.title}:`, details.next_episode_to_air);
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
              console.log(`Found recently aired episode for ${details.title}`);
              return {
                series: details,
                libraryItem: item,
                episode: details.last_episode_to_air,
                airDate: airDate,
                type: 'recent' as const
              };
            }
          }
          
          if (details?.status === 'Returning Series' && !details?.next_episode_to_air) {
            return {
              series: details,
              libraryItem: item,
              episode: null,
              airDate: null,
              type: 'tba' as const
            };
          }
          
          console.log(`No applicable episode for ${details?.title || item.media?.title}`);
          return null;
        })
      );

      const validEpisodes = episodes.filter((i): i is EpisodeItem => i !== null);
      setUpcoming(validEpisodes);
      console.log('Filtered valid episodes:', validEpisodes);
      checkNotifications(validEpisodes);
      setLoading(false);
    };

    loadData();
  }, [watchlist]);

  if (loading) return <div className="text-white p-8">Loading countdown...</div>;

  if (upcoming.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center mt-20 p-8 space-y-4">
        <p className="text-gray-500 text-lg">All caught up! 🎉</p>
        <p className="text-gray-600 text-sm">No upcoming episodes for your current series.</p>
      </div>
    );
  }

  const today = upcoming.filter(i => i.airDate && format(i.airDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd'));
  const others = upcoming.filter(i => !today.includes(i));

  return (
    <div className="p-4 md:p-8 text-white max-w-4xl mx-auto space-y-8">
      <div className="flex justify-between items-center gap-4">
        <h1 className="text-2xl md:text-3xl font-bold">Upcoming Episodes</h1>
        <div className="flex bg-gray-800 rounded-lg p-1">
          <Button variant={view === 'list' ? 'secondary' : 'ghost'} size="sm" onClick={() => setView('list')}><List className="w-4 h-4 mr-2" /> List</Button>
          <Button variant={view === 'calendar' ? 'secondary' : 'ghost'} size="sm" onClick={() => setView('calendar')}><CalendarDays className="w-4 h-4 mr-2" /> Calendar</Button>
        </div>
      </div>
      
      {view === 'list' ? (
        <>
          {today.length > 0 && <HeroSection episode={today[0]} />}
          
          <section>
            <h2 className="text-xl font-bold mb-4">Airing Today</h2>
            <div className="grid gap-4">
              {today.map((ep, i) => <EpisodeCard key={i} ep={ep} updateWatchlistItem={updateWatchlistItem} />)}
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-4">Coming Soon / Ongoing</h2>
            <div className="grid gap-4">
              {others.map((ep, i) => <EpisodeCard key={i} ep={ep} updateWatchlistItem={updateWatchlistItem} />)}
            </div>
          </section>
        </>
      ) : (
        <CalendarView episodes={upcoming.filter(i => i.airDate)} />
      )}
    </div>
  );
}

function StatusBadge({ status }: { status?: string }) {
  if (!status) return null;
  const colors: Record<string, string> = {
    'Returning Series': 'bg-green-500/10 text-green-400 border-green-500/20',
    'Ended': 'bg-gray-500/10 text-gray-400 border-gray-500/20',
    'Canceled': 'bg-red-500/10 text-red-400 border-red-500/20',
    'In Production': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  };
  return <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded border ${colors[status] || 'bg-gray-500/10 text-gray-400 border-gray-500/20'}`}>{status}</span>;
}

function CalendarView({ episodes }: { episodes: any[] }) {
  const [currentDate] = useState(new Date());
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  
  return (
    <div className="bg-gray-900 p-6 rounded-xl">
        <div className="grid grid-cols-7 gap-2">
            {['Su','Mo','Tu','We','Th','Fr','Sa'].map(d => <div key={d} className="text-center font-bold text-gray-500">{d}</div>)}
            {[...Array(monthStart.getDay())].map((_, i) => <div key={i} />)}
            {days.map((date) => {
                const dayEpisodes = episodes.filter(e => format(e.airDate, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd'));
                return (
                    <div key={date.toString()} className="h-20 border border-white/10 p-2 relative">
                        {date.getDate()}
                        {dayEpisodes.length > 0 && <div className="absolute bottom-1 right-1 w-2 h-2 rounded-full bg-blue-500" />}
                    </div>
                )
            })}
        </div>
    </div>
  );
}

function HeroSection({ episode }: { episode: EpisodeItem }) {
  const [timeLeft, setTimeLeft] = useState('');
  
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const diff = differenceInSeconds(episode.airDate, now);
      if (diff <= 0) {
        setTimeLeft('AIRING NOW');
        clearInterval(timer);
      } else {
        const h = Math.floor(diff / 3600);
        const m = Math.floor((diff % 3600) / 60);
        const s = diff % 60;
        setTimeLeft(`${h}h ${m}m ${s}s`);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [episode.airDate]);

  return (
    <div className="bg-gradient-to-r from-blue-900 to-purple-900 p-8 rounded-2xl">
      <h2 className="text-sm font-uppercase text-blue-300">Next Episode</h2>
      <p className="text-4xl font-bold">{episode.series.title}</p>
      <p className="text-xl">{episode.episode.name}</p>
      <p className="text-6xl font-mono mt-4">{timeLeft}</p>
    </div>
  );
}

function EpisodeCard({ ep, updateWatchlistItem }: { ep: EpisodeItem, updateWatchlistItem: (id: string, updates: any) => Promise<void>, key?: any }) {
  const progress = 50; // Placeholder progress

  const handleMarkWatched = () => {
    updateWatchlistItem(ep.libraryItem.id, { status: 'completed' });
    toast.success(`Marked ${ep.series.title} as watched`);
  };

  return (
    <div className="bg-gray-900 p-4 rounded-xl flex items-center gap-4 border border-white/10 flex-wrap relative overflow-hidden group">
      <div className="absolute top-0 right-0 p-2">
        <StatusBadge status={ep.series.status} />
      </div>
      
      <img src={ep.series.poster_url} className="w-16 h-24 object-cover rounded shadow-lg" alt="" />
      
      <div className="flex-1 min-w-[200px] space-y-1">
        <div className="flex items-center gap-2">
          <p className="font-bold text-lg">{ep.series.title}</p>
          {ep.type === 'recent' && <span className="text-[10px] bg-gray-600 px-1 rounded text-white uppercase font-bold">Recently Aired</span>}
          {ep.type === 'tba' && <span className="text-[10px] bg-orange-600/20 border border-orange-500/30 text-orange-400 px-1 rounded uppercase font-bold">TBA</span>}
        </div>
        
        {ep.type === 'tba' ? (
          <p className="text-sm text-orange-400 font-medium italic">Season ongoing — Next episode TBA</p>
        ) : (
          <>
            <p className="text-sm text-gray-400 font-medium">S{ep.episode.season_number} E{ep.episode.episode_number} — {ep.episode.name}</p>
            {ep.airDate && (
              <p className="text-xs text-blue-400">{format(ep.airDate, 'EEEE, MMM d, yyyy')}</p>
            )}
          </>
        )}
        
        <div className="w-full mt-2 pt-2">
            <div className="flex justify-between text-[10px] mb-1">
                <span className="text-gray-500">Progress</span>
                <span className="text-gray-400">{progress}%</span>
            </div>
            <Progress value={progress} className="h-1.5" />
        </div>
      </div>
      
      <Button variant="outline" size="sm" onClick={handleMarkWatched} className="md:ml-auto">Mark Series Finished</Button>
    </div>
  );
}
