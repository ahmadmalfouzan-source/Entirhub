import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';
import { 
  SectionHeader, 
  RecommendationCard, 
  PremiumButton,
  Skeleton
} from '@/components/premium';
import { RefreshCw, LayoutGrid, Zap, Coffee, Ghost, Heart, Sparkles, Filter } from 'lucide-react';
import { getRecommendations } from '@/services/recommendation';
import { useTranslation } from '@/hooks/useTranslation';
import { useStore } from '@/store/useStore';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { getDisplayTitle, getDisplayRating } from '@/lib/display';

const MOODS = [
  { id: 'hyped', icon: Zap, label: 'HYPED', color: 'text-yellow-400' },
  { id: 'chill', icon: Coffee, label: 'CHILL', color: 'text-blue-400' },
  { id: 'dark', icon: Ghost, label: 'DARK', color: 'text-purple-400' },
  { id: 'loved', icon: Heart, label: 'LOVED', color: 'text-red-400' },
];

export function ForYou() {
  const { t } = useTranslation();
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeMood, setActiveMood] = useState('hyped');
  const { addToWatchlist } = useStore();
  const navigate = useNavigate();

  const fetchRecommendations = async () => {
    setLoading(true);
    try {
      const data = await Promise.race([
        getRecommendations(),
        new Promise<any[]>((_, reject) => setTimeout(() => reject(new Error('TIMEOUT')), 8000))
      ]);
      setRecommendations(data.map(item => ({
        external_id: item.external_id,
        media_type: item.media_type,
        title: getDisplayTitle(item),
        poster_url: item.poster_url,
        rating: getDisplayRating(item, item.rating_global),
        reason: item.reason
      })));
    } catch (e) {
      toast.error('AI picks temporarily unavailable — showing fallbacks');
      
      let fallbackItems: any[] = [];
      const watchlist = useStore.getState().watchlist;
      
      if (watchlist && watchlist.length > 0) {
        fallbackItems = [...watchlist]
          .sort(() => Math.random() - 0.5)
          .slice(0, 8)
          .map(item => ({
            external_id: item.media?.external_id || item.id,
            media_type: item.media?.media_type || 'movie',
            title: getDisplayTitle(item.media || item),
            poster_url: item.cover_url || item.media?.poster_url,
            rating: getDisplayRating(item, item.rating),
            reason: item.status === 'watching' ? 'CONTINUE EXPLORING' : 'FROM YOUR LIBRARY'
          }));
      }

      if (fallbackItems.length < 8) {
        try {
          const { fetchTrendingMovies, fetchTrendingSeries } = await import('@/services/api');
          const [movies, series] = await Promise.all([
            fetchTrendingMovies('en-US').catch(() => []),
            fetchTrendingSeries('en-US').catch(() => [])
          ]);
          
          const hardcodedPopular = [
             { title: 'The Boys', external_id: '76479', media_type: 'series', poster_url: 'https://image.tmdb.org/t/p/w500/utw5D6SADLIfE6Qk5h0B8K3sF25.jpg', rating: 8.5 },
             { title: 'Invincible', external_id: '95557', media_type: 'series', poster_url: 'https://image.tmdb.org/t/p/w500/dMOp0hE7DpeYEQWp5n2i9L1RzEn.jpg', rating: 8.7 },
             { title: 'Elden Ring', external_id: '326243', media_type: 'game', poster_url: 'https://media.rawg.io/media/games/5ec/5ecac5cb026ec26a56efcc546364e348.jpg', rating: 4.8 },
             { title: 'Breaking Bad', external_id: '1396', media_type: 'series', poster_url: 'https://image.tmdb.org/t/p/w500/ggFHVNu6YYI5L9pCfOacjizRGt.jpg', rating: 8.9 },
             { title: 'Inception', external_id: '27205', media_type: 'movie', poster_url: 'https://image.tmdb.org/t/p/w500/oYuLEt3zVCKq57qu2F8dT7NIa6f.jpg', rating: 8.4 },
             { title: 'The Last of Us', external_id: '100088', media_type: 'series', poster_url: 'https://image.tmdb.org/t/p/w500/uKvVjHNqB5VmOrdxqAt2F7J78ED.jpg', rating: 8.6 },
             { title: 'God of War', external_id: '11973', media_type: 'game', poster_url: 'https://media.rawg.io/media/games/4be/4be6a6ad0364751a96229c56bf69be59.jpg', rating: 4.9 },
             { title: 'Dune: Part Two', external_id: '693134', media_type: 'movie', poster_url: 'https://image.tmdb.org/t/p/w500/1pdfLvkbY9ohJlCjQH2JGjjcNs3.jpg', rating: 8.3 }
          ];

          const mixed = [...movies.slice(0, 10), ...series.slice(0, 10), ...hardcodedPopular].sort(() => Math.random() - 0.5);
          const trendingFallbacks = mixed.map((item: any) => ({
            external_id: item.external_id || item.id,
            media_type: item.media_type,
            title: getDisplayTitle(item),
            poster_url: item.poster_url,
            rating: getDisplayRating(item, item.rating),
            reason: 'TRENDING PICK - SYSTEM FALLBACK'
          }));
          fallbackItems = [...fallbackItems, ...trendingFallbacks];
        } catch (apiError) {}
      }
      
      const unique = [];
      const seen = new Set();
      for (const item of fallbackItems) {
        if (!seen.has(item.external_id) && item.external_id) {
          seen.add(item.external_id);
          unique.push(item);
        }
      }
      setRecommendations(unique.slice(0, 10));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecommendations();
  }, []);

  const handleAddToList = (item: any) => {
    addToWatchlist({
      external_id: item.external_id,
      media_type: item.media_type,
      status: 'planned',
      title: item.title,
      cover_url: item.poster_url,
    });
    toast.success(`Priority tracking set for ${item.title}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#030308] p-6 pt-24 space-y-12">
        <Skeleton variant="text" className="w-48 h-10" />
        <div className="flex gap-4 overflow-hidden">
           {[1, 2, 3].map(i => <Skeleton key={i} variant="card" className="min-w-[150px] h-12" />)}
        </div>
        {[...Array(2)].map((_, i) => (
          <Skeleton key={i} variant="card" className="aspect-[4/5] rounded-[48px]" />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#030308] pb-32 animate-in fade-in duration-700">
      {/* Immersive Background Elements */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[20%] right-[-5%] w-[30%] h-[30%] bg-primary/10 blur-[100px] rounded-full" />
        <div className="absolute bottom-[20%] left-[-5%] w-[30%] h-[30%] bg-accent/5 blur-[100px] rounded-full" />
      </div>

      {/* Immersive Sticky Header */}
      <div className="sticky top-0 z-[100] bg-[#030308]/60 backdrop-blur-3xl border-b border-white/5 px-6 py-5 flex items-center justify-between">
         <div className="flex flex-col">
            <span className="text-[10px] font-black text-primary tracking-[0.4em] uppercase mb-0.5 leading-none">Personal Picks</span>
            <h1 className="text-2xl font-black text-white italic tracking-tighter uppercase leading-none">FOR YOU<span className="text-primary italic-none">.</span></h1>
         </div>
         <div className="flex gap-2">
            <PremiumButton 
              variant="glass" 
              size="icon" 
              className="h-12 w-12 rounded-[22px] border-white/5 active:scale-90 group" 
              onClick={fetchRecommendations}
            >
               <RefreshCw className={cn("w-5 h-5 text-gray-400 group-hover:text-primary transition-colors", loading && "animate-spin")} />
            </PremiumButton>
         </div>
      </div>

      <div className="relative z-10 px-6 py-8 space-y-12">
        {/* Mood Selector - Synergized with Home */}
        <section className="space-y-4">
          <div className="flex items-center justify-between px-1">
             <span className="text-[10px] font-black text-gray-500 tracking-[0.2em] uppercase leading-none">Vibe Filter</span>
             <Sparkles className="w-3.5 h-3.5 text-primary" />
          </div>
          <div className="flex gap-3 overflow-x-auto no-scrollbar -mx-6 px-6">
             {MOODS.map((mood) => (
               <button
                 key={mood.id}
                 onClick={() => {
                   setActiveMood(mood.id);
                   toast.info(`Adjusting intelligence for ${mood.label} levels`);
                 }}
                 className={cn(
                   "flex items-center gap-3 px-6 py-4 rounded-[24px] border transition-all shrink-0 active:scale-95 group",
                   activeMood === mood.id 
                    ? "bg-white/10 border-white/20 shadow-2xl" 
                    : "bg-white/[0.02] border-white/5 opacity-40 hover:opacity-100"
                 )}
               >
                 <mood.icon className={cn("w-4 h-4 transition-transform group-hover:scale-110", activeMood === mood.id ? mood.color : "text-gray-400")} />
                 <span className={cn("text-[11px] font-black tracking-[0.15em]", activeMood === mood.id ? "text-white" : "text-gray-500")}>
                   {mood.label}
                 </span>
               </button>
             ))}
          </div>
        </section>

        {/* Discovery Feed */}
        <div className="grid grid-cols-1 gap-12">
          {loading ? (
             [0, 1].map(x => (
               <Skeleton key={x} variant="card" className="aspect-[4/5] rounded-[48px] shadow-2xl" />
             ))
          ) : (
            <AnimatePresence mode="popLayout">
              {recommendations.map((item, idx) => (
                <motion.div 
                  key={`${item.external_id}-${idx}`}
                  initial={{ y: 50, opacity: 0, scale: 0.95 }}
                  whileInView={{ y: 0, opacity: 1, scale: 1 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.5, delay: idx * 0.1 }}
                  className="group perspective-1000"
                >
                  <RecommendationCard 
                    title={item.title}
                    poster={item.poster_url}
                    reason={item.reason || `MATCHES YOUR ${activeMood.toUpperCase()} VIBE`}
                    mediaType={item.media_type.toUpperCase()}
                    rating={item.rating}
                    onExplore={() => navigate(`/content/${item.media_type}_${item.external_id || item.id}`)}
                    onAdd={() => handleAddToList(item)}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>

        {/* End of Line Marker */}
        {recommendations.length > 0 && (
          <motion.div 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            className="py-16 mt-8 border-t border-white/5 text-center flex flex-col items-center"
          >
             <div className="w-12 h-1 bg-gradient-to-r from-transparent via-primary to-transparent rounded-full mb-8" />
             <p className="text-[10px] font-black text-gray-700 uppercase tracking-[0.4em] mb-6 italic opacity-50">Signal Horizon Reached</p>
             <PremiumButton 
               variant="neon" 
               className="h-16 px-12 rounded-[28px] shadow-[0_20px_40px_rgba(var(--color-primary-rgb),0.3)] bg-primary text-white" 
               onClick={fetchRecommendations}
             >
                <RefreshCw className="w-5 h-5 mr-3" /> RECALIBRATE FEED
             </PremiumButton>
          </motion.div>
        )}
      </div>
    </div>
  );
}
