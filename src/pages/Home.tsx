import { useEffect, useState } from 'react';
import { ContentCard } from '@/components/ContentCard';
import { Sparkles, TrendingUp, Moon, Users, CalendarDays, ChevronRight } from 'lucide-react';
import { fetchTrendingMovies, fetchTrendingSeries, fetchCalendarReleases, MediaItem } from '@/services/api';
import { useStore } from '@/store/useStore';
import { useTranslation } from '@/hooks/useTranslation';
import { useLanguageStore } from '@/store/useLanguageStore';
import { getFeedActivities } from '@/services/activityService';
import { Link, useNavigate } from 'react-router-dom';
import { formatDistanceToNow, startOfMonth, endOfMonth, format, differenceInDays } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export function Home() {
  const [trending, setTrending] = useState<MediaItem[]>([]);
  const [recommended, setRecommended] = useState<MediaItem[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [upcoming, setUpcoming] = useState<any[]>([]);
  const [monthReleases, setMonthReleases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { watchlist } = useStore();
  const { t } = useTranslation();
  const { language } = useLanguageStore();
  const navigate = useNavigate();

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const lang = language === 'ar' ? 'ar' : 'en-US';
        const now = new Date();
        const start = format(startOfMonth(now), 'yyyy-MM-dd');
        const end = format(endOfMonth(now), 'yyyy-MM-dd');

        const [movies, series, activityData, calData] = await Promise.all([
          fetchTrendingMovies(lang),
          fetchTrendingSeries(lang),
          getFeedActivities(),
          fetchCalendarReleases(start, end)
        ]);
        
        const mixed = [...movies.slice(0, 5), ...series.slice(0, 5)].sort(() => Math.random() - 0.5);
        setTrending(mixed.slice(0, 5));
        setRecommended(mixed.slice(5, 10));
        setActivities(activityData || []);
        setUpcoming(watchlist.filter(item => item.media?.media_type === 'series' && item.status === 'watching').slice(0, 1));
        
        // Filter for upcoming releases in current month
        const upcomingReleases = calData
          .filter(r => new Date(r.release_date) >= now)
          .sort((a, b) => new Date(a.release_date).getTime() - new Date(b.release_date).getTime());
        setMonthReleases(upcomingReleases);
      } catch (error) {
        console.error('Error loading home data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [language, watchlist]);

  const watchTonight = watchlist.filter(item => item.status === 'watch_tonight');
  const gamesTracked = watchlist.filter(item => item.media?.media_type === 'game').length;
  const moviesWatched = watchlist.filter(item => item.media?.media_type === 'movie' && item.status === 'completed').length;
  const seriesCompleted = watchlist.filter(item => item.media?.media_type === 'series' && item.status === 'completed').length;

  return (
    <div className="p-4 md:p-8 space-y-8 md:space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-300 ease-in-out">
      
      {/* Friend Activity Preview */}
      {activities.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4 md:mb-6">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 md:w-6 md:h-6 text-blue-400" />
              <h2 className="text-xl md:text-2xl font-bold text-foreground">{t('friendActivity')}</h2>
            </div>
            <Link to="/feed" className="text-sm text-blue-400 hover:text-blue-300">{t('seeAll')}</Link>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-4">
            {activities.slice(0, 3).map(act => (
              <div key={act.id} onClick={() => navigate('/feed')} className="flex-shrink-0 w-72 bg-[#111827] p-4 rounded-xl border border-white/5 flex items-center gap-3 cursor-pointer hover:border-white/10 transition-all">
                <img src={act.profiles?.avatar_url || 'https://images.unsplash.com/photo-1616530940355-351fabd9524b?w=50&q=80'} className="w-10 h-10 rounded-full" alt="" />
                <div className="min-w-0">
                  <p className="text-sm font-bold text-white truncate">{act.profiles?.username} {act.type} {act.media?.title}</p>
                  <p className="text-xs text-gray-500">{formatDistanceToNow(new Date(act.created_at))} ago</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Countdown Widget */}
      {upcoming.length > 0 && (
        <section className="bg-[#111827] rounded-xl border border-white/5 p-4 flex items-center gap-4 hover:border-white/10 transition-all cursor-pointer" onClick={() => navigate('/countdown')}>
            <div className="w-12 h-16 rounded overflow-hidden">
                <img src={upcoming[0].media.poster_url} className="w-full h-full object-cover" alt="" />
            </div>
            <div>
                <p className="text-sm font-bold text-white">Next up: {upcoming[0].media.title}</p>
                <p className="text-xs text-blue-400">View upcoming episodes</p>
            </div>
        </section>
      )}

      {/* Coming This Month Widget */}
      {monthReleases.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-blue-400" />
              <h2 className="text-xl font-bold text-white">Coming This Month</h2>
            </div>
            <Link to="/calendar" className="text-sm text-blue-400 flex items-center gap-1 hover:text-blue-300 transition-colors">
              View Calendar <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
            {monthReleases.slice(0, 4).map(release => {
              const releaseDate = new Date(release.release_date);
              const daysTo = differenceInDays(releaseDate, new Date());
              return (
                <Link 
                  key={release.external_id} 
                  to="/calendar" 
                  className="flex-shrink-0 w-48 bg-[#111827] rounded-2xl overflow-hidden border border-white/5 hover:border-white/10 transition-all group shadow-lg"
                >
                  <div className="relative h-28 overflow-hidden">
                    <img 
                      src={release.poster_url} 
                      className="w-full h-full object-cover opacity-60 group-hover:opacity-80 group-hover:scale-105 transition-all duration-500" 
                      alt={release.title} 
                    />
                    <div className="absolute top-2 left-2">
                      <Badge className="bg-blue-600/90 backdrop-blur-md text-[10px] border-0 h-5 px-2 font-bold shadow-xl">
                        {daysTo > 0 ? `In ${daysTo} days` : daysTo === 0 ? 'Today' : 'Recently Released'}
                      </Badge>
                    </div>
                  </div>
                  <div className="p-3">
                    <p className="text-xs font-bold text-white truncate">{release.title}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className={cn(
                        "w-1.5 h-1.5 rounded-full",
                        release.media_type === 'movie' ? "bg-blue-500" : 
                        release.media_type === 'series' ? "bg-purple-500" : "bg-green-500"
                      )} />
                      <p className="text-[10px] text-gray-500 uppercase font-medium tracking-wider">{release.media_type}</p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* Welcome Banner */}
      <div className="relative rounded-2xl md:rounded-3xl overflow-hidden bg-gradient-to-r from-blue-900/40 to-purple-900/40 border border-border p-6 md:p-10">
        <div className="hidden md:block absolute inset-0 bg-[url('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop')] opacity-10 bg-cover bg-center mix-blend-overlay"></div>
        <div className="relative z-10 max-w-2xl">
          <h1 className="text-2xl md:text-4xl font-bold text-foreground mb-2 md:mb-4">{t('welcomeTitle')}</h1>
          <p className="text-sm md:text-lg text-muted-foreground mb-6 md:mb-8">{t('welcomeSubtitle')}</p>
          <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
            <div className="bg-card/80 backdrop-blur-sm rounded-xl p-3 md:p-4 border border-border flex-1">
              <div className="text-muted-foreground text-xs md:text-sm mb-1">{t('gamesTracked')}</div>
              <div className="text-xl md:text-2xl font-bold text-foreground">{gamesTracked}</div>
            </div>
            <div className="bg-card/80 backdrop-blur-sm rounded-xl p-3 md:p-4 border border-border flex-1">
              <div className="text-muted-foreground text-xs md:text-sm mb-1">{t('moviesWatched')}</div>
              <div className="text-xl md:text-2xl font-bold text-foreground">{moviesWatched}</div>
            </div>
            <div className="bg-card/80 backdrop-blur-sm rounded-xl p-3 md:p-4 border border-border flex-1">
              <div className="text-muted-foreground text-xs md:text-sm mb-1">{t('seriesCompleted')}</div>
              <div className="text-xl md:text-2xl font-bold text-foreground">{seriesCompleted}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Watch Tonight Section */}
      {watchTonight.length > 0 && (
        <section className="bg-blue-500/5 border border-blue-500/10 rounded-2xl md:rounded-3xl p-6 md:p-8">
          <div className="flex items-center gap-2 mb-4 md:mb-6">
            <Moon className="w-5 h-5 md:w-6 md:h-6 text-blue-400" />
            <h2 className="text-xl md:text-2xl font-bold text-foreground">{t('watchTonight')}</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
            {watchTonight.map(item => (
              <ContentCard 
                key={item.id} 
                item={{
                  external_id: item.media.external_id || '',
                  media_type: item.media.media_type,
                  title: item.media.title,
                  poster_url: item.media.poster_url,
                  rating: item.rating || 0,
                  release_date: item.media.release_date || '',
                  genres: []
                }} 
              />
            ))}
          </div>
        </section>
      )}

      {/* Trending Section */}
      <section>
        <div className="flex items-center gap-2 mb-4 md:mb-6">
          <TrendingUp className="w-5 h-5 md:w-6 md:h-6 text-blue-400" />
          <h2 className="text-xl md:text-2xl font-bold text-foreground">{t('trending')}</h2>
        </div>
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-36 sm:h-auto sm:aspect-[2/3] bg-card rounded-xl animate-pulse border border-border"></div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
            {trending.map(item => (
              <ContentCard key={item.external_id} item={item} />
            ))}
          </div>
        )}
      </section>

      {/* Recommended Section */}
      <section>
        <div className="flex items-center gap-2 mb-4 md:mb-6">
          <Sparkles className="w-5 h-5 md:w-6 md:h-6 text-purple-400" />
          <h2 className="text-xl md:text-2xl font-bold text-foreground">{t('recommended')}</h2>
        </div>
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-36 sm:h-auto sm:aspect-[2/3] bg-card rounded-xl animate-pulse border border-border"></div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
            {recommended.map(item => (
              <ContentCard key={item.external_id} item={item} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
