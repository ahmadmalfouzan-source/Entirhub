import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  Star, 
  Plus, 
  Play, 
  X, 
  Activity, 
  BookOpen, 
  Zap, 
  Clock, 
  Share2,
  Trash2,
  ChevronLeft,
  Calendar,
  Layers,
  Heart
} from 'lucide-react';
import { 
  SectionHeader, 
  GameCard,
  PremiumButton, 
  PremiumCard, 
  ProgressCard, 
  AchievementCard, 
  ReviewCard, 
  EpisodeCard,
  PremiumBadge,
  Skeleton
} from '@/components/premium';
import { fetchMediaDetails, fetchMediaVideos, fetchSimilar, MediaItem } from '@/services/api';
import { useStore } from '@/store/useStore';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { EpisodeTracker } from '@/components/EpisodeTracker';
import { GameAchievementTracker } from '@/components/GameAchievementTracker';
import { useTranslation } from '@/hooks/useTranslation';
import { useLanguageStore } from '@/store/useLanguageStore';
import { ReviewSection } from '@/components/ReviewSection';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';

export function ContentDetail() {
  const { id } = useParams();
  const [item, setItem] = useState<MediaItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [trailerKey, setTrailerKey] = useState<string | null>(null);
  const [showTrailer, setShowTrailer] = useState(false);
  const [similarTitles, setSimilarTitles] = useState<MediaItem[]>([]);
  const [realProgress, setRealProgress] = useState<number>(0);
  const { t } = useTranslation();
  const { language } = useLanguageStore();
  const navigate = useNavigate();
  const { 
    watchlist, 
    addToWatchlist, 
    updateWatchlistItem, 
    removeFromWatchlist, 
    updateHoursPlayed,
    toggle100Completion
  } = useStore();

  const fetchedId = useRef<string | null>(null);

  useEffect(() => {
    if (fetchedId.current === id) return;
    
    const loadData = async () => {
      if (!id) return;
      fetchedId.current = id;
      setLoading(true);
      
      let fetchedType: 'movie' | 'series' | 'game' = 'movie';
      if (id.includes('_game_')) fetchedType = 'game';
      else if (id.includes('_series_')) fetchedType = 'series';
      else if (id.includes('_movie_')) fetchedType = 'movie';

      try {
        const lang = language === 'ar' ? 'ar-SA' : 'en-US';
        const data = await fetchMediaDetails(id, fetchedType, lang);
        setItem(data);

        if (data) {
          if (data.media_type !== 'game') {
            const videos = await fetchMediaVideos(data.media_type, data.external_id);
            const trailer = videos.find(v => v.type === 'Trailer' && v.site === 'YouTube');
            if (trailer) setTrailerKey(trailer.key);
            
            fetchSimilar(data.media_type, data.external_id).then(setSimilarTitles);
          }
        }
      } catch (error) {
        console.error("Failed to load details", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [id, language]);

  const watchlistItem = watchlist.find(w => w.media?.external_id === (item?.external_id || id));

  useEffect(() => {
    const calculateProgress = async () => {
      if (!watchlistItem || !item) {
        setRealProgress(0);
        return;
      }

      const { calculateMediaProgress } = await import('@/lib/progress');
      if (item.media_type === 'series') {
        const { fetchSeasons, getWatchedEpisodes } = await import('@/services/episodes');
        const [seasonsData, watchedData] = await Promise.all([
          fetchSeasons(item.external_id || ''),
          getWatchedEpisodes(watchlistItem.id)
        ]);
        const progress = calculateMediaProgress(watchlistItem, watchedData, seasonsData.seasons);
        setRealProgress(progress);
      } else {
        setRealProgress(calculateMediaProgress(watchlistItem, [], []));
      }
    };

    calculateProgress();
  }, [watchlistItem?.id, item?.external_id]);

  const handleAddToList = async () => {
    if (!item) return;
    await addToWatchlist({
      external_id: item.external_id,
      media_type: item.media_type,
      status: 'planned',
      title: item.title,
      cover_url: item.poster_url,
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#030308] p-6 space-y-8 pt-24">
        <Skeleton variant="card" className="w-full h-[40dvh] rounded-[48px]" />
        <div className="space-y-4">
          <Skeleton variant="text" className="w-64 h-10" />
          <Skeleton variant="text" className="w-full h-24" />
        </div>
      </div>
    );
  }

  if (!item) return null;

  return (
    <div className="flex flex-col min-h-screen bg-[#030308] pb-40 animate-in fade-in duration-700 overflow-x-hidden">
      {/* Immersive Backdrop */}
      <div className="fixed top-0 left-0 right-0 h-[80dvh] pointer-events-none z-0">
        <motion.img 
          initial={{ scale: 1.1, opacity: 0 }}
          animate={{ scale: 1, opacity: 0.4 }}
          transition={{ duration: 1.5 }}
          src={item.backdrop_url || item.poster_url} 
          className="w-full h-full object-cover blur-[2px]" 
          alt="" 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#030308] via-[#030308]/80 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#030308]/40 to-transparent" />
      </div>

      {/* Floating Header */}
      <div className="fixed top-0 left-0 right-0 z-[110] p-6">
        <div className="flex items-center justify-between">
          <PremiumButton 
            variant="glass" 
            size="icon" 
            className="h-14 w-14 rounded-[22px] border-white/5 shadow-2xl active:scale-90" 
            onClick={() => navigate(-1)}
          >
            <ChevronLeft className="w-6 h-6 text-white" />
          </PremiumButton>
          
          <div className="flex items-center gap-3">
            <PremiumButton variant="glass" size="icon" className="h-14 w-14 rounded-[22px] border-white/5 active:scale-90">
              <Share2 className="w-5 h-5 text-white" />
            </PremiumButton>
            {watchlistItem && (
              <PremiumButton 
                variant="glass" 
                size="icon" 
                className={cn("h-14 w-14 rounded-[22px] border-white/5 shadow-2xl active:scale-90 transition-colors", watchlistItem ? "text-primary" : "text-white")}
              >
                <Heart className={cn("w-5 h-5", watchlistItem && "fill-current")} />
              </PremiumButton>
            )}
          </div>
        </div>
      </div>

      {/* Hero Content */}
      <div className="relative z-10 px-8 pt-[35dvh] flex flex-col">
        <motion.div 
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="flex flex-col md:flex-row gap-8 items-end"
        >
          <div className="w-44 md:w-56 aspect-[2/3] rounded-[48px] overflow-hidden shadow-[0_40px_80px_rgba(0,0,0,0.8)] border border-white/10 shrink-0 group perspective-1000">
             <motion.img 
               whileHover={{ scale: 1.1, rotateY: 5 }}
               src={item.poster_url} 
               className="w-full h-full object-cover transition-transform duration-700" 
               alt="" 
             />
          </div>
          <div className="flex flex-col gap-4 text-left">
            <div className="flex items-center gap-2">
               <PremiumBadge className="bg-primary text-white font-black tracking-widest">{item.media_type.toUpperCase()}</PremiumBadge>
               {item.release_date && (
                 <div className="flex items-center gap-1.5 px-3 py-1 bg-white/5 rounded-full border border-white/10">
                    <Calendar className="w-3 h-3 text-gray-500" />
                    <span className="text-[10px] font-black text-gray-300">{format(new Date(item.release_date), 'yyyy')}</span>
                 </div>
               )}
            </div>
            <h2 className="text-4xl md:text-6xl font-black text-white leading-[0.95] italic tracking-tighter drop-shadow-2xl uppercase">
              {item.title}
            </h2>
            <div className="flex items-center gap-6 mt-2">
               <div className="flex flex-col">
                  <span className="text-[10px] font-black text-gray-500 tracking-widest">CRITIC SCORE</span>
                  <div className="flex items-center gap-1.5 pt-1">
                    <Star className="w-4 h-4 text-yellow-500 fill-current" />
                    <span className="text-xl font-black text-white">{item.rating?.toFixed(1) || 'N/A'}</span>
                  </div>
               </div>
               <div className="h-8 w-px bg-white/10" />
               <div className="flex flex-col">
                  <span className="text-[10px] font-black text-gray-500 tracking-widest uppercase">Genre</span>
                  <p className="text-[11px] font-black text-primary mt-1 tracking-wider uppercase">
                    {item.genres?.slice(0, 2).join(' • ')}
                  </p>
               </div>
            </div>
          </div>
        </motion.div>

        <div className="mt-16 space-y-16">
          {/* Overview Wrapper */}
          <section className="premium-glass p-8 rounded-[48px] border border-white/5 space-y-6 relative overflow-hidden group">
             <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                <Layers className="w-32 h-32" />
             </div>
             <SectionHeader title="The Intelligence" subtitle="DATABASE SUMMARY" />
             <p className="text-gray-400 leading-relaxed text-lg font-medium tracking-tight">
               {item.description}
             </p>
          </section>

          {/* User Specific Data */}
          {watchlistItem && (
            <section className="space-y-8">
               <SectionHeader title="Vitals" subtitle="PERSONAL TRACKING & METRICS" />
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <ProgressCard 
                    title={item.title}
                    status={watchlistItem.status.toUpperCase()}
                    progress={realProgress}
                    label={item.media_type === 'game' ? "SYNC LEVEL" : "VISUAL PROGRESS"}
                  />
                  
                  <div className="premium-glass p-8 rounded-[40px] border border-white/5 flex flex-col justify-between gap-6">
                     <div className="flex items-center justify-between">
                        <span className="text-[11px] font-black text-gray-500 uppercase tracking-[0.3em]">User Verdict</span>
                        <div className="flex gap-1.5">
                          {[1, 2, 3, 4, 5].map(s => (
                            <motion.button 
                              key={s}
                              whileTap={{ scale: 0.8 }}
                              whileHover={{ scale: 1.2 }}
                              onClick={() => updateWatchlistItem(watchlistItem.id, { rating: s })}
                            >
                              <Star className={cn("w-7 h-7 transition-all", (watchlistItem.rating || 0) >= s ? "text-yellow-400 fill-current drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]" : "text-white/10")} />
                            </motion.button>
                          ))}
                        </div>
                     </div>
                     <div className="flex items-center justify-between pt-4 border-t border-white/5 uppercase">
                        <div className="flex flex-col">
                           <span className="text-[9px] font-black text-gray-600 tracking-widest">Added</span>
                           <span className="text-xs font-black text-white">{format(new Date(watchlistItem.added_at || new Date()), 'MMM yyyy')}</span>
                        </div>
                        <PremiumButton 
                          variant="glass" 
                          size="icon" 
                          className="rounded-2xl h-12 w-12 border-red-500/10 hover:bg-red-500/20 group/trash" 
                          onClick={() => removeFromWatchlist(watchlistItem.id)}
                        >
                           <Trash2 className="w-5 h-5 text-red-500/50 group-hover/trash:text-red-500 transition-colors" />
                        </PremiumButton>
                     </div>
                  </div>
               </div>
            </section>
          )}

          {/* Dynamic Sections Based on Type */}
          <AnimatePresence mode="wait">
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true }}
              className="space-y-16"
            >
              {item.media_type === 'series' && (
                <section className="space-y-8">
                   <SectionHeader title="Continuity" subtitle="EPISODIC BREAKDOWN" />
                   <div className="premium-glass p-1 rounded-[48px] border border-white/5 overflow-hidden">
                      <EpisodeTracker mediaId={watchlistItem?.media_id || item.external_id} externalId={item.external_id} />
                   </div>
                </section>
              )}

              {item.media_type === 'game' && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <PremiumButton 
                      variant="glass" 
                      className="h-20 rounded-[32px] border-white/10 group shadow-lg" 
                      onClick={() => navigate(`/wiki/${item.external_id}`)}
                    >
                       <BookOpen className="w-6 h-6 mr-3 group-hover:text-primary transition-colors" /> 
                       <span className="font-black italic tracking-tight">OSINT STRATEGY</span>
                    </PremiumButton>
                    {watchlistItem && (
                      <PremiumButton 
                        variant={watchlistItem.is_completed_100 ? "neon" : "glass"} 
                        className="h-20 rounded-[32px] border-white/10 group"
                        onClick={() => toggle100Completion(watchlistItem.id, !watchlistItem.is_completed_100)}
                      >
                        <Zap className={cn("w-6 h-6 mr-3 transition-colors", watchlistItem.is_completed_100 ? "fill-current text-white" : "group-hover:text-yellow-400")} /> 
                        <span className="font-black italic tracking-tight uppercase">Full Clearance</span>
                      </PremiumButton>
                    )}
                  </div>

                  <section className="space-y-8">
                     <SectionHeader title="Logistics" subtitle="TROPHY SYSTEM" />
                     <div className="premium-glass p-8 rounded-[48px] border border-white/5">
                        <GameAchievementTracker gameName={item.title} mediaId={watchlistItem?.media_id || item.external_id} externalId={item.external_id} />
                     </div>
                  </section>
                </>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Social Proof */}
          <section className="space-y-10">
             <SectionHeader title="Transmission" subtitle="COMMUNITY FEEDBACK" />
             <div className="premium-glass p-8 rounded-[48px] border border-white/5">
                <ReviewSection mediaId={item.external_id} />
             </div>
          </section>

          {/* Similar Intelligence */}
          {similarTitles.length > 0 && (
            <section className="space-y-8">
               <SectionHeader title="Analogous" subtitle="RELATED INTELLIGENCE" />
               <div className="flex gap-5 overflow-x-auto no-scrollbar snap-x -mx-8 px-8 py-4">
                  {similarTitles.slice(0, 8).map(similar => (
                    <div key={similar.external_id} className="min-w-[180px] snap-start">
                       <GameCard 
                         title={similar.title}
                         poster={similar.poster_url}
                         rating={similar.rating}
                         onClick={() => navigate(`/content/${similar.external_id || similar.id}`)}
                       />
                    </div>
                  ))}
               </div>
            </section>
          )}
        </div>
      </div>

      {/* Ultra-Polished Floating Action Bar */}
      <AnimatePresence>
        <motion.div 
          initial={{ y: 120 }} 
          animate={{ y: 0 }} 
          className="fixed bottom-0 left-0 right-0 z-[120] p-8 bg-gradient-to-t from-[#030308] to-transparent pointer-events-none"
        >
           <div className="max-w-xl mx-auto flex gap-4 pointer-events-auto">
             {!watchlistItem ? (
               <PremiumButton 
                 fullWidth 
                 size="xl" 
                 className="rounded-[32px] h-20 shadow-[0_20px_60px_rgba(var(--color-primary-rgb),0.4)] bg-primary text-white hover:scale-[1.02] active:scale-95 transition-all text-lg" 
                 onClick={handleAddToList}
               >
                  <Plus className="w-6 h-6 mr-3" /> 
                  <span className="font-black italic">DEPLOY TO LIBRARY</span>
               </PremiumButton>
             ) : (
               <PremiumButton 
                 variant="glass" 
                 fullWidth 
                 size="xl" 
                 className="rounded-[32px] h-20 border-white/10 backdrop-blur-3xl text-primary font-black italic text-lg"
               >
                  <Activity className="w-6 h-6 mr-3" /> 
                  IN RECONNAISSANCE
               </PremiumButton>
             )}
             {trailerKey && (
               <motion.button
                 whileHover={{ scale: 1.05, rotate: 2 }}
                 whileTap={{ scale: 0.9 }}
                 onClick={() => setShowTrailer(true)}
                 className="w-20 h-20 rounded-[32px] bg-white text-black flex items-center justify-center shadow-2xl shrink-0 group transition-all active:bg-primary active:text-white"
               >
                  <Play className="w-8 h-8 fill-current translate-x-0.5 group-hover:scale-110 transition-transform" />
               </motion.button>
             )}
           </div>
        </motion.div>
      </AnimatePresence>

      {/* Cinematic Trailer Overlay */}
      <AnimatePresence>
        {showTrailer && trailerKey && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center bg-black/95 backdrop-blur-xl p-4 md:p-12"
          >
             <motion.div 
               initial={{ scale: 0.9, y: 20 }}
               animate={{ scale: 1, y: 0 }}
               exit={{ scale: 0.9, y: 20 }}
               className="relative w-full max-w-6xl aspect-video bg-black rounded-[48px] overflow-hidden border border-white/10 shadow-[0_0_100px_rgba(0,0,0,1)]"
             >
                <PremiumButton 
                  variant="glass" 
                  size="icon" 
                  className="absolute top-6 right-6 z-10 rounded-2xl h-12 w-12 bg-black/40 hover:bg-black/60" 
                  onClick={() => setShowTrailer(false)}
                >
                   <X className="w-6 h-6 text-white" />
                </PremiumButton>
                <iframe 
                  src={`https://www.youtube.com/embed/${trailerKey}?autoplay=1&rel=0&modestbranding=1`} 
                  className="w-full h-full border-0" 
                  allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" 
                  allowFullScreen 
                />
             </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
