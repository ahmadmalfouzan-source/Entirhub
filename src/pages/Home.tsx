import { useEffect, useState } from 'react';
import { ContentCard } from '@/components/ContentCard';
import { Sparkles, TrendingUp, Moon } from 'lucide-react';
import { fetchTrendingMovies, fetchTrendingSeries, MediaItem } from '@/services/api';
import { useStore } from '@/store/useStore';
import { useTranslation } from '@/hooks/useTranslation';
import { useLanguageStore } from '@/store/useLanguageStore';

export function Home() {
  const [trending, setTrending] = useState<MediaItem[]>([]);
  const [recommended, setRecommended] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { watchlist } = useStore();
  const { t } = useTranslation();
  const { language } = useLanguageStore();

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      const lang = language === 'ar' ? 'ar-SA' : 'en-US';
      const [movies, series] = await Promise.all([
        fetchTrendingMovies(lang),
        fetchTrendingSeries(lang)
      ]);
      
      // Mix them up for trending
      const mixed = [...movies.slice(0, 5), ...series.slice(0, 5)].sort(() => Math.random() - 0.5);
      setTrending(mixed.slice(0, 5));
      setRecommended(mixed.slice(5, 10));
      setLoading(false);
    };
    
    loadData();
  }, [language]);

  const watchTonight = watchlist.filter(item => item.status === 'watch_tonight');
  const gamesTracked = watchlist.filter(item => item.media?.media_type === 'game').length;
  const moviesWatched = watchlist.filter(item => item.media?.media_type === 'movie' && item.status === 'completed').length;
  const seriesCompleted = watchlist.filter(item => item.media?.media_type === 'series' && item.status === 'completed').length;

  return (
    <div className="p-4 md:p-8 space-y-8 md:space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-300 ease-in-out">
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
