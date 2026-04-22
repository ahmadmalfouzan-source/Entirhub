import React, { useEffect, useState } from 'react';
import { 
  GameCard, 
  SectionHeader, 
  PremiumButton, 
  Skeleton,
  PremiumInput
} from '@/components/premium';
import { Gamepad2, Search, Trophy, Bookmark, Play } from 'lucide-react';
import { fetchGames, fetchTopRatedGames, MediaItem } from '@/services/api';
import { useStore } from '@/store/useStore';
import { useTranslation } from '@/hooks/useTranslation';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';

export default function Games() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [topRated, setTopRated] = useState<MediaItem[]>([]);
  const [searchResults, setSearchResults] = useState<MediaItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const { watchlist, updateWatchlistItem } = useStore();

  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);
      const data = await fetchTopRatedGames();
      setTopRated(data);
      setLoading(false);
    };
    loadInitialData();
  }, []);

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchQuery.trim()) {
        setIsSearching(true);
        const data = await fetchGames(searchQuery);
        setSearchResults(data);
        setIsSearching(false);
      } else {
        setSearchResults([]);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const backlog = watchlist.filter(item => 
    item.media?.media_type === 'game' && item.status === 'planned'
  );

  const handleStartPlaying = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    updateWatchlistItem(id, { status: 'watching' });
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#030308] pb-40 animate-in fade-in duration-700">
      {/* Immersive Header & Search */}
      <div className="pt-24 px-6 space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-[22px] bg-gradient-to-br from-primary to-accent p-0.5 shadow-2xl">
              <div className="w-full h-full rounded-[20px] bg-[#030308] flex items-center justify-center">
                <Gamepad2 className="w-6 h-6 text-primary" />
              </div>
            </div>
            <div>
              <h1 className="text-3xl font-black text-white italic tracking-tighter uppercase">{t('games')}</h1>
              <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest leading-none mt-1">INTERACTIVE EXPERIENCE</p>
            </div>
          </div>

          <div className="md:w-72">
            <PremiumInput 
              icon={Search} 
              placeholder={t('searchGames')} 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-white/[0.02] border-white/10"
            />
          </div>
        </div>
      </div>

      <div className="px-6 py-12 space-y-16">
        <AnimatePresence mode="wait">
          {searchQuery ? (
            <motion.section 
              key="search"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              <SectionHeader title={t('searchResults')} subtitle={`QUERY: ${searchQuery.toUpperCase()}`} />
              {isSearching ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
                   {[...Array(10)].map((_, i) => <Skeleton key={i} variant="card" className="h-[280px]" />)}
                </div>
              ) : searchResults.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
                  {searchResults.map(item => (
                    <GameCard 
                      key={item.external_id} 
                      title={item.title} 
                      poster={item.poster_url} 
                      rating={item.rating}
                      onClick={() => navigate(`/content/${item.external_id}`)}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-20 bg-white/[0.02] rounded-[48px] border border-dashed border-white/10">
                   <p className="text-sm font-black text-gray-500 uppercase tracking-widest">{t('noGamesFound')} "{searchQuery}"</p>
                </div>
              )}
            </motion.section>
          ) : (
            <div className="space-y-16">
              {backlog.length > 0 && (
                <section className="space-y-8">
                  <SectionHeader 
                    title={t('myBacklog')} 
                    subtitle={`${backlog.length} UNITS PENDING`} 
                  />
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
                    {backlog.map(item => (
                      <div key={item.id} className="relative group">
                        <GameCard 
                          title={item.media.title} 
                          poster={item.media.poster_url} 
                          rating={item.rating || 0}
                          onClick={() => navigate(`/content/${item.media.external_id}`)}
                        />
                        <div className="absolute inset-x-4 bottom-4 z-20 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all">
                          <PremiumButton 
                            onClick={(e) => handleStartPlaying(item.id, e)}
                            className="w-full h-10 rounded-2xl bg-primary text-white shadow-2xl scale-95 hover:scale-100"
                          >
                            <Play className="w-3 h-3 mr-2 fill-current" />
                            {t('startPlaying')}
                          </PremiumButton>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              <section className="space-y-8">
                <SectionHeader title={t('topRatedGames')} subtitle="ELITE PERFORMANCE" icon={Trophy} />
                {loading ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
                    {[...Array(10)].map((_, i) => <Skeleton key={i} variant="card" className="h-[280px]" />)}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
                    {topRated.map(item => (
                      <GameCard 
                        key={item.external_id} 
                        title={item.title} 
                        poster={item.poster_url} 
                        rating={item.rating}
                        onClick={() => navigate(`/content/${item.external_id}`)}
                      />
                    ))}
                  </div>
                )}
              </section>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
