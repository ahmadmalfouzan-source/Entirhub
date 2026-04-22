import { useEffect, useState } from 'react';
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
      <div className="p-6 pt-24 space-y-12 bg-[#030308] min-h-screen">
        <Skeleton variant="text" className="w-48 h-8" />
        <Skeleton variant="card" className="w-full aspect-[16/9] rounded-[48px]" />
        <div className="grid grid-cols-2 gap-4">
           <Skeleton variant="card" className="h-44 rounded-[32px]" />
           <Skeleton variant="card" className="h-44 rounded-[32px]" />
        </div>
        <div className="space-y-4">
           <Skeleton variant="text" className="w-32" />
           <div className="flex gap-4 overflow-hidden">
              {[1, 2, 3].map(i => <Skeleton key={i} variant="card" className="min-w-[150px] h-56 rounded-[32px] shrink-0" />)}
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
            <h1 className="text-2xl font-black text-white italic leading-none tracking-tighter">HUB<span className="text-primary italic-none">.</span></h1>
          </motion.div>
          <div className="flex items-center gap-3">
             <PremiumButton variant="glass" size="icon" className="rounded-2xl h-12 w-12 border-white/5 active:scale-90" onClick={() => navigate('/library')}>
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

        {/* Featured Smart Pick - Refined Visual */}
        <motion.div 
          initial={{ y: 30, opacity: 0 }} 
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          {recommended[0] && (
            <RecommendationCard 
              title={recommended[0].title}
              poster={recommended[0].poster_url}
              reason={`MATCHES YOUR ${activeMood.toUpperCase()} VIBE`}
              mediaType={recommended[0].media_type.toUpperCase()}
              rating={recommended[0].rating}
              onExplore={() => navigate(`/content/${recommended[0].external_id || recommended[0].id}`)}
              onAdd={() => navigate(`/content/${recommended[0].external_id || recommended[0].id}`)}
            />
          )}
        </motion.div>

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
              title={ongoing.media?.title || 'Unknown Content'}
              status={ongoing.media?.media_type.toUpperCase() || 'MEDIA'}
              progress={ongoingProgress}
              rating={ongoing.rating}
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
          <div className="flex gap-5 overflow-x-auto no-scrollbar snap-x -mx-6 px-6 py-2">
             {trending.map((item, idx) => (
               <motion.div 
                 key={item.external_id || item.id} 
                 initial={{ opacity: 0, scale: 0.9 }}
                 whileInView={{ opacity: 1, scale: 1 }}
                 viewport={{ once: true }}
                 transition={{ delay: idx * 0.05 }}
                 className="min-w-[180px] snap-start"
               >
                 <GameCard 
                   title={item.title}
                   poster={item.poster_url}
                   rating={item.rating}
                   onClick={() => navigate(`/content/${item.external_id || item.id}`)}
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
                  className="flex gap-5 items-center premium-glass p-6 rounded-[32px] border border-white/5 hover:bg-white/10 transition-all group"
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
                        <span className="text-gray-500 font-medium lowercase ml-1.5">just started</span> 
                        <br />
                        <span className="text-[13px] font-black uppercase tracking-tight">{act.media?.title}</span>
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                         <div className="h-1 w-8 bg-primary rounded-full" />
                         <p className="text-[9px] text-gray-600 font-black uppercase tracking-[0.2em]">{format(new Date(act.created_at), 'HH:mm')} • Activity</p>
                      </div>
                   </div>
                   <PremiumButton variant="glass" size="icon" className="h-12 w-12 rounded-2xl group-hover:bg-primary group-hover:text-white transition-all">
                      <Activity className="w-5 h-5" />
                   </PremiumButton>
                </motion.div>
             )) : (
                <div className="p-12 text-center opacity-20 border-2 border-dashed border-white/10 rounded-[40px]">
                   <Users className="w-12 h-12 mx-auto mb-4" />
                   <p className="text-xs font-black uppercase tracking-widest">No social activity</p>
                </div>
             )}
          </div>
        </section>
      </div>
    </div>
  );
}
