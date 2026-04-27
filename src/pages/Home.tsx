import { useEffect, useState, useRef } from 'react';
import { 
  SectionHeader, 
  GameCard, 
  ProgressCard, 
  RecommendationCard, 
  PremiumButton,
  StatWidget,
  Skeleton
} from '@/components/premium';
import { Search, Activity, Sparkles, TrendingUp, Filter, Heart, Zap, Coffee, Ghost, Users } from 'lucide-react';
import { getDisplayTitle, getDisplayRating } from '@/lib/display';
import { fetchTrendingMovies, fetchTrendingSeries, MediaItem } from '@/services/api';
import { useStore } from '@/store/useStore';
import { useTranslation } from '@/hooks/useTranslation';
import { useLanguageStore } from '@/store/useLanguageStore';
import { getFeedActivities } from '@/services/activityService';
import { Link, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';

const MOODS = [
  { id: 'hyped', icon: Zap, label: 'HYPED', color: 'text-yellow-400' },
  { id: 'chill', icon: Coffee, label: 'CHILL', color: 'text-blue-400' },
  { id: 'dark', icon: Ghost, label: 'DARK', color: 'text-purple-400' },
  { id: 'loved', icon: Heart, label: 'LOVED', color: 'text-red-400' },
];

export function Home() {
  const carouselRef = useRef<HTMLDivElement>(null);
  const [trending, setTrending] = useState<MediaItem[]>([]);
  const [recommended, setRecommended] = useState<MediaItem[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeMood, setActiveMood] = useState('hyped');
  const [ongoingProgress, setOngoingProgress] = useState<number>(0);
  const { user, watchlist } = useStore();
  const { t } = useTranslation();
  const { language } = useLanguageStore();
  const navigate = useNavigate();

  const ongoing = watchlist.find(item => item.status === 'watching');

  useEffect(() => {
    const el = carouselRef.current;
    if (!el) return;
    
    let isDown = false;
    let startX: number;
    let scrollLeft: number;

    const handleWheel = (e: WheelEvent) => {
      // If horizontal swiping is more pronounced than vertical
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
        e.preventDefault();
        el.scrollLeft += e.deltaX;
      }
      // Otherwise do nothing and let it scroll the page naturally!
    };
    
    // Add non passive event listener so preventDefault works smoothly.
    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      el.removeEventListener('wheel', handleWheel);
    };
  }, []);

  useEffect(() => {
    const calculate = async () => {
      if (!ongoing) return;                
      const { calculateMediaProgress } = await import('@/lib/progress');

      if (ongoing.media?.media_type === 'series') {
        const { fetchSeasons, getWatchedEpisodes } = await import('@/services/episodes');
        const [seasonsData, watchedData] = await Promise.all([
          fetchSeasons(ongoing.media?.external_id || ''),
          getWatchedEpisodes(ongoing.id)
        ]);
        setOngoingProgress(calculateMediaProgress(ongoing, watchedData, seasonsData.seasons));
      } else {
        setOngoingProgress(calculateMediaProgress(ongoing, [], []));
      }
    };
    
    calculate();
  }, [ongoing?.id]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const lang = language === 'ar' ? 'ar' : 'en-US';
        const [movies, series] = await Promise.all([
          fetchTrendingMovies(lang),
          fetchTrendingSeries(lang)
        ]);

        setTimeout(async () => {
          try {
            const activityData = await getFeedActivities();
            setActivities(activityData || []);
          } catch (e) {
            console.warn('Friend activity failed to load', e);
          }
        }, 1000);
        
        const mixed = [...movies.slice(0, 10), ...series.slice(0, 10)].sort(() => Math.random() - 0.5);
        setTrending(mixed.slice(0, 8));
        setRecommended(mixed.slice(8, 16));
      } catch (error) {
        console.error('Error loading home data:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [language]);

  if (loading) {
    return (
      <div className="p-6 pt-24 space-y-12 bg-[#030308] min-h-screen animate-pulse">
        {/* Header Skeleton */}
        <div className="flex justify-between items-center mb-8">
           <div className="space-y-2">
              <Skeleton variant="text" className="w-24 h-3 bg-white/5" />
              <Skeleton variant="text" className="w-16 h-6 bg-white/5" />
           </div>
           <div className="flex gap-3">
              <Skeleton variant="circle" className="w-12 h-12 rounded-2xl bg-white/5" />
              <Skeleton variant="circle" className="w-12 h-12 rounded-2xl bg-white/5" />
           </div>
        </div>

        {/* Mood Chips */}
        <div className="flex gap-3 overflow-hidden">
           {[1, 2, 3, 4].map(i => <Skeleton key={i} variant="card" className="w-28 h-12 rounded-[24px] shrink-0 bg-white/5" />)}
        </div>

        {/* Hero Card */}
        <Skeleton variant="card" className="w-full aspect-[4/5] md:aspect-[16/9] rounded-[48px] bg-white/5" />

        {/* Stats Strip */}
        <div className="grid grid-cols-2 gap-4">
           <Skeleton variant="card" className="h-32 rounded-[32px] bg-white/5" />
           <Skeleton variant="card" className="h-32 rounded-[32px] bg-white/5" />
        </div>

        {/* Trending Section */}
        <div className="space-y-6">
           <div className="flex justify-between items-center">
              <div className="space-y-2">
                 <Skeleton variant="text" className="w-32 h-6 bg-white/5" />
                 <Skeleton variant="text" className="w-24 h-3 bg-white/5" />
              </div>
              <Skeleton variant="text" className="w-16 h-4 bg-white/5" />
           </div>
           <div className="flex gap-5 overflow-hidden -mx-6 px-6">
              {[1, 2, 3].map(i => <Skeleton key={i} variant="card" className="w-[140px] md:w-[160px] aspect-[2/3] rounded-3xl shrink-0 bg-white/5" />)}
           </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#030308] pb-32 animate-in fade-in duration-700">
      {/* Immersive Background Elements */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/10 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent/5 blur-[100px] rounded-full" />
      </div>

      {/* Header Stat Strip */}
      <div className="sticky top-0 z-[100] bg-[#030308]/60 backdrop-blur-3xl border-b border-white/5 px-6 py-5">
        <div className="flex items-center justify-between">
          <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="flex flex-col">
            <span className="text-[10px] font-black text-primary tracking-[0.4em] uppercase mb-0.5">{format(new Date(), 'EEEE, MMM do')}</span>
            <h1 className="text-2xl font-black text-white italic leading-none tracking-tighter">ENTERTAIN<span className="text-primary italic-none">HUB.</span></h1>
          </motion.div>
          <div className="flex items-center gap-3">
             <PremiumButton variant="glass" size="icon" className="rounded-2xl h-12 w-12 border-white/5 active:scale-90" onClick={() => navigate('/search')}>
               <Search className="w-5 h-5 text-gray-400" />
             </PremiumButton>
             <Link to="/profile" className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary via-primary/80 to-accent active:scale-90 transition-all overflow-hidden border border-white/10 p-0.5 shadow-lg">
               <img src={user?.user_metadata?.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&q=80'} className="w-full h-full object-cover rounded-[14px]" alt="" />
             </Link>
          </div>
        </div>
      </div>

      <div className="relative z-10 flex flex-col space-y-14 py-8 px-6">
        {/* Mood Chips - NEW UX POINT */}
        <section className="space-y-4">
          <div className="flex items-center justify-between px-1">
             <span className="text-[10px] font-black text-gray-500 tracking-[0.2em] uppercase">Current Mood</span>
             <Filter className="w-3.5 h-3.5 text-gray-700" />
          </div>
          <div className="flex gap-3 overflow-x-auto no-scrollbar -mx-6 px-6">
             {MOODS.map((mood) => (
               <button
                 key={mood.id}
                 onClick={() => setActiveMood(mood.id)}
                 className={cn(
                   "flex items-center gap-3 px-6 py-4 rounded-[24px] border transition-all shrink-0 active:scale-95",
                   activeMood === mood.id 
                    ? "bg-white/10 border-white/20 shadow-xl" 
                    : "bg-white/[0.02] border-white/5 opacity-40 hover:opacity-100"
                 )}
               >
                 <mood.icon className={cn("w-4 h-4", activeMood === mood.id ? mood.color : "text-gray-400")} />
                 <span className={cn("text-[10px] font-black tracking-widest", activeMood === mood.id ? "text-white" : "text-gray-500")}>
                   {mood.label}
                 </span>
               </button>
             ))}
          </div>
        </section>

        {/* Featured Smart Picks - Swipeable Carousel */}
        <section>
          <div 
            ref={carouselRef}
            className="flex gap-4 overflow-x-auto no-scrollbar snap-x snap-mandatory -mx-6 px-6 pb-6 pt-2"
          >
            {recommended.slice(0, 5).map((rec, idx) => (
              <motion.div 
                key={rec.external_id || rec.id}
                initial={{ y: 30, opacity: 0 }} 
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: idx * 0.1 }}
                className="w-full min-w-[280px] md:min-w-[400px] shrink-0 pointer-events-auto"
              >
                <RecommendationCard 
                  title={getDisplayTitle(rec)}
                  poster={rec.poster_url}
                  reason={`MATCHES YOUR ${activeMood.toUpperCase()} VIBE`}
                  mediaType={rec.media_type.toUpperCase()}
                  rating={getDisplayRating(rec, rec.rating)}
                  onExplore={() => navigate(`/content/${rec.media_type}_${rec.external_id || rec.id}`)}
                  onAdd={() => navigate(`/content/${rec.media_type}_${rec.external_id || rec.id}`)}
                />
              </motion.div>
            ))}
          </div>
        </section>

        {/* Continue Watching / Progress */}
        {ongoing && (
          <motion.section 
            initial={{ y: 30, opacity: 0 }} 
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="space-y-6"
          >
            <SectionHeader title="Resume" subtitle="PICK UP WHERE YOU LEFT OFF" />
            <ProgressCard 
              title={getDisplayTitle(ongoing.media || ongoing)}
              status={ongoing.media?.media_type.toUpperCase() || 'MEDIA'}
              progress={ongoingProgress}
              rating={getDisplayRating(ongoing, ongoing.rating)}
              label={ongoing.media?.media_type === 'game' ? 'STORY PROGRESS' : 'WATCH PROGRESS'}
            />
          </motion.section>
        )}

        {/* Home Stats Strip - Refined Grid */}
        <div className="grid grid-cols-2 gap-4">
           <StatWidget label="Tracking" value={watchlist.length} icon={Activity} />
           <StatWidget label="Trending" value="8 New" icon={TrendingUp} color="text-accent" />
        </div>

        {/* Trending Section - Improved Layout */}
        <section className="space-y-6">
          <SectionHeader 
            title={t('trending')} 
            subtitle="GLOBAL HOT TITLES"
            action={<button onClick={() => navigate('/library')} className="text-[10px] font-black text-primary uppercase tracking-widest active:scale-95 transition-transform">{t('seeAll')}</button>}
          />
           <div className="flex gap-5 overflow-x-auto no-scrollbar snap-x snap-mandatory -mx-6 px-6 py-4 after:content-[''] after:w-1 after:pr-6 after:shrink-0">
             {trending.map((item, idx) => (
               <motion.div 
                 key={item.external_id || item.id} 
                 initial={{ opacity: 0, scale: 0.9 }}
                 whileInView={{ opacity: 1, scale: 1 }}
                 viewport={{ once: true }}
                 transition={{ delay: idx * 0.05 }}
                 className="min-w-[160px] md:min-w-[220px] snap-center group hover:scale-105 transition-transform duration-500 hover:shadow-[0_0_30px_rgba(0,0,0,0.5)]"
               >
                 <GameCard 
                   title={getDisplayTitle(item)}
                   poster={item.poster_url}
                   rating={getDisplayRating(item, item.rating)}
                   onClick={() => navigate(`/content/${item.media_type ? item.media_type + '_' : ''}${item.external_id || item.id}`)}
                 />
               </motion.div>
             ))}
          </div>
        </section>

        {/* Social / Friend Activity - Immersive Card */}
        <section className="space-y-6">
          <SectionHeader title="Social Hub" subtitle="RECENT FRIEND ACTIVITY" />
          <div className="flex flex-col gap-4">
             {activities.length > 0 ? activities.slice(0, 3).map((act, idx) => (
                <motion.div 
                  key={act.id} 
                  initial={{ x: 20, opacity: 0 }}
                  whileInView={{ x: 0, opacity: 1 }}
                  transition={{ delay: idx * 0.1 }}
                  className="flex gap-5 items-center premium-glass p-6 rounded-[32px] border border-white/5 hover:bg-white/10 transition-all group cursor-pointer"
                  onClick={() => navigate(`/user/${act.profiles?.username}`)}
                >
                   <div className="relative">
                     <img src={act.profiles?.avatar_url} className="w-14 h-14 rounded-[22px] ring-2 ring-white/5 object-cover" alt="" />
                     <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-lg bg-primary flex items-center justify-center border-2 border-[#030308]">
                        <Sparkles className="w-3 h-3 text-white" />
                     </div>
                   </div>
                   <div className="flex-1 min-w-0">
                      <p className="text-sm text-white font-bold leading-snug">
                        <span className="text-primary italic">{act.profiles?.username}</span>
                        <span className="text-gray-500 font-medium lowercase ml-1.5">{act.type === 'reviewed' ? 'reviewed' : 'just added'}</span> 
                        <br />
                        <span className="text-[13px] font-black uppercase tracking-tight truncate block">{act.media?.title}</span>
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                         <div className="h-1 w-8 bg-primary rounded-full" />
                         <p className="text-[9px] text-gray-600 font-black uppercase tracking-[0.2em]">{format(new Date(act.created_at), 'HH:mm')} • Activity</p>
                      </div>
                   </div>
                </motion.div>
             )) : (
                <div className="relative p-8 text-center border-2 border-dashed border-white/10 rounded-[32px] flex flex-col items-center justify-center bg-white/[0.02] overflow-hidden group">
                   
                   {/* Animated Background Grid for Empty State */}
                   <div className="absolute inset-0 z-0 opacity-0 group-hover:opacity-100 transition-opacity duration-1000">
                     <div className="absolute inset-0" style={{
                       backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.15) 1px, transparent 0)',
                       backgroundSize: '24px 24px',
                       animation: 'pulse-grid 4s infinite alternate'
                     }} />
                     <div className="absolute inset-0 bg-gradient-to-t from-[#030308] to-transparent" />
                     <style dangerouslySetInnerHTML={{ __html: `
                       @keyframes pulse-grid {
                         0% { opacity: 0.1; transform: scale(1); }
                         100% { opacity: 0.4; transform: scale(1.05); }
                       }
                     `}} />
                   </div>

                   <div className="relative z-10 w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                     <Users className="w-8 h-8 text-primary opacity-80" />
                   </div>
                   <h3 className="relative z-10 text-sm font-black text-white uppercase tracking-widest mb-2">No Social Activity</h3>
                   <p className="relative z-10 text-[10px] text-gray-500 font-bold max-w-[240px] mb-6 uppercase tracking-wider leading-relaxed">Your network is silent. Find friends to see what they are watching and playing.</p>
                   <PremiumButton variant="glass" size="sm" onClick={() => navigate('/friends')} className="relative z-10 rounded-2xl border-white/10 px-8 py-3 h-auto active:scale-95">
                     <Users className="w-4 h-4 mr-2" /> DISCOVER
                   </PremiumButton>
                </div>
             )}
          </div>
        </section>
      </div>
    </div>
  );
}
