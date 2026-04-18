import { useEffect, useState } from 'react';
import { ContentCard } from '@/components/ContentCard';
import { NetflixRow } from '@/components/netflix/NetflixRow';
import { DisneyRow } from '@/components/disney/DisneyRow';
import { HBOHero } from '@/components/hbo/HBOHero';
import { HBORow } from '@/components/hbo/HBORow';
import { Sparkles, TrendingUp, Moon, Users, CalendarDays, ChevronRight, Play, Plus } from 'lucide-react';
import { fetchTrendingMovies, fetchTrendingSeries, fetchCalendarReleases, MediaItem } from '@/services/api';
import { useStore } from '@/store/useStore';
import { useThemeStore } from '@/store/useThemeStore';
import { useTranslation } from '@/hooks/useTranslation';
import { useLanguageStore } from '@/store/useLanguageStore';
import { getFeedActivities } from '@/services/activityService';
import { Link, useNavigate } from 'react-router-dom';
import { formatDistanceToNow, startOfMonth, endOfMonth, format, differenceInDays } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

function HomeSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex flex-row sm:flex-col h-36 sm:h-auto rounded-xl overflow-hidden bg-card/50 border border-border/50 animate-pulse">
          <div className="aspect-[2/3] h-full sm:h-auto sm:w-full bg-white/5" />
          <div className="p-3 md:p-4 flex-1 space-y-2">
            <div className="h-4 bg-white/10 rounded w-3/4" />
            <div className="h-3 bg-white/5 rounded w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

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

        const [movies, series, calData] = await Promise.all([
          fetchTrendingMovies(lang),
          fetchTrendingSeries(lang),
          fetchCalendarReleases(start, end)
        ]);

        // Friends activities are fetched separately and later to prioritize trending content
        setTimeout(async () => {
          try {
            const activityData = await getFeedActivities();
            setActivities(activityData || []);
          } catch (e) {
            console.warn('Friend activity failed to load (auth lock), skipping...', e);
          }
        }, 1000);
        
        const mixed = [...movies.slice(0, 5), ...series.slice(0, 5)].sort(() => Math.random() - 0.5);
        setTrending(mixed.slice(0, 5));
        setRecommended(mixed.slice(0, 5)); // Use first 5 as recommended for fastest first paint
        
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
  }, [language]);

  // Handle upcoming and welcome stats (purely client-side from watchlist)
  useEffect(() => {
    if (watchlist.length > 0) {
      setUpcoming(watchlist.filter(item => item.media?.media_type === 'series' && item.status === 'watching').slice(0, 1));
    }
  }, [watchlist]);

  const watchTonight = watchlist.filter(item => item.status === 'watch_tonight');
  const gamesTracked = watchlist.filter(item => item.media?.media_type === 'game').length;
  const moviesWatched = watchlist.filter(item => item.media?.media_type === 'movie' && item.status === 'completed').length;
  const seriesCompleted = watchlist.filter(item => item.media?.media_type === 'series' && item.status === 'completed').length;

  const { themeName } = useThemeStore();
  
  if (themeName === 'netflix') {
    return (
      <div className="flex flex-col min-h-screen bg-black -mt-16 md:-mt-20">
        {/* Billboard Hero */}
        <div className="relative w-full h-[50vh] md:h-[90vh] mb-4 md:mb-8 group">
          {trending.length > 0 && (
            <>
              <img 
                src={(trending[0] as any).backdrop_url || trending[0].poster_url} 
                alt={trending[0].title}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-[#141414]/20 to-transparent md:via-[#141414]/40" />
              <div className="absolute inset-0 bg-gradient-to-r from-[#141414]/90 via-[#141414]/50 to-transparent md:from-[#141414] md:via-[#141414]/50" />
              
              <div className="absolute bottom-[10%] md:bottom-[20%] left-4 md:left-12 max-w-2xl pr-4">
                <h1 className="text-3xl sm:text-4xl md:text-7xl font-black text-white drop-shadow-2xl mb-2 md:mb-4 leading-tight">
                  {trending[0].title}
                </h1>
                <p className="text-xs sm:text-sm md:text-lg text-white/90 drop-shadow-lg mb-4 md:mb-6 line-clamp-3">
                  {(trending[0] as any).overview || "A great title you'll definitely enjoy. Watch it today on EntertainHub."}
                </p>
                <div className="flex items-center gap-3 md:gap-4">
                  <button className="flex items-center gap-2 bg-white text-black px-4 md:px-8 min-h-[44px] md:py-3 rounded md:rounded-md font-bold hover:bg-white/80 transition shadow-[0_0_20px_rgba(255,255,255,0.3)] text-sm md:text-base">
                    <TrendingUp className="w-4 h-4 md:w-6 md:h-6 fill-current" /> Play
                  </button>
                  <button className="flex items-center gap-2 bg-gray-500/50 text-white px-4 md:px-8 min-h-[44px] md:py-3 rounded md:rounded-md font-bold hover:bg-gray-500/70 transition backdrop-blur-sm text-sm md:text-base">
                    <Sparkles className="w-4 h-4 md:w-6 md:h-6" /> More Info
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {loading ? (
           <div className="p-8 md:p-12 text-white text-center">Loading Netflix interface...</div>
        ) : (
          <div className="relative z-10 -mt-16 sm:-mt-24 md:-mt-32 space-y-4 md:space-y-8 pb-20 overflow-hidden">
            {watchTonight.length > 0 && (
              <NetflixRow 
                title={'Continue Watching'} 
                items={watchTonight.map(item => ({
                  id: item.media.external_id,
                  external_id: item.media.external_id || '',
                  media_type: item.media.media_type,
                  title: item.media.title,
                  poster_url: item.media.poster_url,
                  backdrop_url: (item.media as any).backdrop_url || item.media.poster_url || '',
                  rating: item.rating || 0,
                  release_date: item.media.release_date || '',
                  overview: (item.media as any).overview || '',
                  genres: item.media.genres || []
                })) as any[]} 
              />
            )}
            
            <NetflixRow title={'Trending Now'} items={trending} />
            
            {monthReleases.length > 0 && (
              <NetflixRow 
                title="New Releases" 
                items={monthReleases.map(release => ({
                  id: release.external_id,
                  external_id: release.external_id,
                  title: release.title,
                  media_type: release.media_type,
                  poster_url: release.poster_url,
                  backdrop_url: (release as any).backdrop_url || release.poster_url,
                  rating: release.rating || 0,
                  release_date: release.release_date || '',
                  overview: (release as any).overview || 'Fresh off the press.',
                  genres: release.genres || []
                }))}
              />
            )}

            <NetflixRow title={'Top Rated'} items={recommended} />
          </div>
        )}
      </div>
    );
  }

  if (themeName === 'disney') {
    return (
      <div className="flex flex-col min-h-screen text-[#f9f9f9] -mt-16 md:-mt-20">
        {/* Disney Hero */}
        <div className="relative w-full h-[60vh] md:h-[85vh] mb-4 md:mb-12 flex items-end md:items-center">
          {trending.length > 0 && (
            <>
              <img 
                src={(trending[0] as any).backdrop_url || trending[0].poster_url} 
                alt={trending[0].title}
                className="absolute inset-0 w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#040714] via-[#040714]/40 to-transparent md:via-[#040714]/40" />
              <div className="absolute inset-0 bg-gradient-to-r from-[#040714]/90 via-[#040714]/60 to-transparent md:from-[#040714] md:via-[#040714]/60" />
              
              <div className="relative z-10 w-full px-4 md:px-12 pb-8 md:pb-0 md:absolute md:bottom-[20%] max-w-2xl flex flex-col pt-24 md:pt-0">
                <h1 className="text-3xl sm:text-5xl md:text-7xl font-black text-[#f9f9f9] drop-shadow-[0_0_15px_rgba(0,0,0,0.8)] mb-2 md:mb-4 tracking-tight" style={{ fontFamily: 'monospace' }}>
                  {trending[0].title}
                </h1>
                <p className="text-xs sm:text-sm md:text-lg text-[#f9f9f9]/90 drop-shadow-xl mb-4 md:mb-6 line-clamp-3 md:line-clamp-4 max-w-xl">
                  {(trending[0] as any).overview || "Explore this amazing title and more on EntertainHub+."}
                </p>
                <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3 md:gap-4">
                  <button className="flex items-center justify-center gap-2 bg-[#f9f9f9] text-black px-6 md:px-8 py-3 w-full sm:w-auto rounded md:rounded-lg font-bold hover:bg-white/80 transition-all sm:hover:scale-105 min-h-[44px] text-sm md:text-base">
                    <Play className="w-4 h-4 md:w-5 md:h-5 fill-current" /> Watch Now
                  </button>
                  <button className="flex items-center justify-center gap-2 bg-black/60 border border-white/50 text-[#f9f9f9] px-6 md:px-8 py-3 w-full sm:w-auto rounded md:rounded-lg font-bold hover:bg-white/20 transition-all sm:hover:scale-105 min-h-[44px] text-sm md:text-base">
                    <Plus className="w-4 h-4 md:w-5 md:h-5" /> Add
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {loading ? (
           <div className="p-8 md:p-12 text-[#f9f9f9] text-center">Loading Disney interface...</div>
        ) : (
          <div className="relative z-10 pb-20 space-y-4 md:space-y-0">
            {watchTonight.length > 0 && (
              <DisneyRow 
                title="Continue Watching" 
                items={watchTonight.map(i => i.media)} 
              />
            )}
            
            <DisneyRow title="Trending" items={trending} />
            
            {monthReleases.length > 0 && (
              <DisneyRow title="New to EntertainHub" items={monthReleases} />
            )}
            
            <DisneyRow title="Top Picks For You" items={recommended} />
          </div>
        )}
      </div>
    );
  }

  if (themeName === 'hbo') {
    return (
      <div className="flex flex-col min-h-screen text-white bg-[#0d0d0d] -mt-16 md:-mt-20">
        <HBOHero items={trending} />
        
        {loading ? (
          <div className="p-8 md:p-16 text-center text-gray-400 font-medium tracking-wider uppercase">Loading catalog...</div>
        ) : (
          <div className="relative z-10 pb-20 md:bg-gradient-to-t md:from-[#0d0d0d] md:via-[#0d0d0d] md:to-transparent space-y-2 md:space-y-0 pt-4 md:pt-0">
            {watchTonight.length > 0 && (
              <HBORow 
                title="Continue Watching" 
                items={watchTonight.map(i => i.media)} 
              />
            )}
            
            <HBORow title="Critically Acclaimed" items={trending} />
            
            {monthReleases.length > 0 && (
              <HBORow title="New & Noteworthy" items={monthReleases} />
            )}
            
            <HBORow title="Top Rated" items={recommended} />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-8 md:space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-300 ease-in-out">
      
      {/* Friend Activity Preview */}
      {activities.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4 md:mb-6">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 md:w-6 md:h-6 text-accent" />
              <h2 className="text-xl md:text-2xl font-bold text-foreground">{t('friendActivity')}</h2>
            </div>
            <Link to="/feed" className="text-sm text-accent hover:text-blue-300">{t('seeAll')}</Link>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-4">
            {activities.slice(0, 3).map(act => (
              <div key={act.id} onClick={() => navigate('/feed')} className="flex-shrink-0 w-72 bg-surface p-4 rounded-xl border border-white/5 flex items-center gap-3 cursor-pointer hover:border-white/10 transition-all">
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
        <section className="bg-surface rounded-xl border border-white/5 p-4 flex items-center gap-4 hover:border-white/10 transition-all cursor-pointer" onClick={() => navigate('/countdown')}>
            <div className="w-12 h-16 rounded overflow-hidden">
                <img src={upcoming[0].media.poster_url} className="w-full h-full object-cover" alt="" />
            </div>
            <div>
                <p className="text-sm font-bold text-white">Next up: {upcoming[0].media.title}</p>
                <p className="text-xs text-accent">View upcoming episodes</p>
            </div>
        </section>
      )}

      {/* Coming This Month Widget */}
      {monthReleases.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-accent" />
              <h2 className="text-xl font-bold text-white">Coming This Month</h2>
            </div>
            <Link to="/calendar" className="text-sm text-accent flex items-center gap-1 hover:text-blue-300 transition-colors">
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
                  className="flex-shrink-0 w-48 bg-surface rounded-2xl overflow-hidden border border-white/5 hover:border-white/10 transition-all group shadow-lg"
                >
                  <div className="relative h-28 overflow-hidden">
                    <img 
                      src={release.poster_url} 
                      className="w-full h-full object-cover opacity-60 group-hover:opacity-80 group-hover:scale-105 transition-all duration-500" 
                      alt={release.title} 
                    />
                    <div className="absolute top-2 left-2">
                      <Badge className="bg-primary/90 backdrop-blur-md text-[10px] border-0 h-5 px-2 font-bold shadow-xl">
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
            <Moon className="w-5 h-5 md:w-6 md:h-6 text-accent" />
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
          <TrendingUp className="w-5 h-5 md:w-6 md:h-6 text-accent" />
          <h2 className="text-xl md:text-2xl font-bold text-foreground">{t('trending')}</h2>
        </div>
        {loading ? (
          <HomeSkeleton />
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
          <HomeSkeleton />
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
