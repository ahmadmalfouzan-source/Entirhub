import React, { useEffect, useState } from 'react';
import { useStore } from '@/store/useStore';
import { supabase } from '@/lib/supabase';
import { 
  Settings, 
  ChevronRight,
  TrendingUp,
  Globe,
  Lock,
  Users,
  Trophy,
  Award,
  Zap,
  Activity,
  Target,
  Flame,
  ShieldCheck,
  LayoutGrid,
  Plus
} from 'lucide-react';
import { 
  SectionHeader, 
  PremiumButton, 
  PremiumCard, 
  StatWidget, 
  ProgressCard,
  PremiumBadge,
  Skeleton
} from '@/components/premium';
import { Badges } from '@/components/Badges';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from '@/hooks/useTranslation';
import { useLanguageStore } from '@/store/useLanguageStore';
import { getFriends, Friendship } from '@/services/friendsService';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';

export function Profile() {
  const { t } = useTranslation();
  const { language, setLanguage } = useLanguageStore();
  const { user, watchlist, avatarUrl } = useStore();
  const navigate = useNavigate();
  const [friends, setFriends] = useState<Friendship[]>([]);
  const [username, setUsername] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [loading, setLoading] = useState(true);

  const toggleLanguage = () => {
    const newLang = language === 'en' ? 'ar' : 'en';
    setLanguage(newLang);
  };

  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);
        if (!user) return;
        
        const { data, error: profileError } = await supabase
          .from('profiles')
          .select('username, is_public')
          .eq('id', user.id)
          .maybeSingle();
        
        if (profileError && profileError.code !== 'PGRST116') {
          console.warn('Profile fetch warning:', profileError);
        }

        if (data) {
          setUsername(data.username || user.email?.split('@')[0] || '');
          setIsPublic(data.is_public || false);
        }
        
        const friendData = await getFriends();
        setFriends(friendData);
      } catch (err) {
        console.error('Critical profile initialization error:', err);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [user]);

  const totalXP = watchlist.length * 150 + friends.length * 500;
  const currentTierXP = Math.floor(totalXP / 1000) * 1000;
  const nextTierXP = currentTierXP + 1000;
  const rankProgress = (totalXP - currentTierXP) / 1000;

  const stats = {
    movies: watchlist.filter(i => i.media?.media_type === 'movie').length,
    series: watchlist.filter(i => i.media?.media_type === 'series').length,
    games: watchlist.filter(i => i.media?.media_type === 'game').length,
    total: watchlist.length,
    level: Math.floor(watchlist.length / 5) + 1,
    progress: rankProgress
  };

  if (loading) {
    return (
      <div className="p-6 pt-24 space-y-12 bg-[#030308] min-h-screen">
        <Skeleton variant="circle" className="w-32 h-32 mx-auto rounded-[44px]" />
        <Skeleton variant="text" className="w-48 h-8 mx-auto" />
        <div className="grid grid-cols-3 gap-3">
           <Skeleton variant="card" className="h-24" />
           <Skeleton variant="card" className="h-24" />
           <Skeleton variant="card" className="h-24" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#030308] pb-40 animate-in fade-in duration-700 overflow-x-hidden">
      {/* Dynamic Background */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-0 right-0 h-96 bg-primary/20 blur-[120px] rounded-full opacity-50" />
      </div>

      {/* Immersive Profile Header */}
      <div className="relative pt-24 pb-24 px-6">
        <div className="relative z-10 flex flex-col items-center text-center space-y-8">
          {/* Avatar with Status Ring */}
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="relative"
          >
             <div className="w-36 h-36 rounded-[48px] bg-gradient-to-br from-primary via-[#030308] to-accent p-1 shadow-[0_40px_80px_rgba(0,0,0,0.6)]">
                <div className="w-full h-full rounded-[44px] bg-[#030308] overflow-hidden border-4 border-[#030308]">
                   <img src={avatarUrl || user?.user_metadata?.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&q=80'} className="w-full h-full object-cover" alt="" />
                </div>
             </div>
             <motion.div 
               animate={{ rotate: 360 }}
               transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
               className="absolute -inset-2 border-2 border-dashed border-primary/20 rounded-[56px] pointer-events-none" 
             />
             <div className="absolute -bottom-3 -right-3 w-14 h-14 rounded-2xl bg-primary flex items-center justify-center text-white shadow-2xl border-4 border-[#030308]">
                <span className="text-[14px] font-black italic">LV.{stats.level}</span>
             </div>
          </motion.div>

          <div className="space-y-2">
             <h1 className="text-4xl font-black text-white italic tracking-tighter uppercase">{username}</h1>
             <div className="flex items-center justify-center gap-3">
                <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{user?.email}</span>
                <div className="w-1 h-1 rounded-full bg-white/20" />
                <span className="text-[10px] font-black text-primary uppercase tracking-widest flex items-center gap-1.5 italic">
                   {isPublic ? <Globe className="w-3 h-3 shrink-0" /> : <Lock className="w-3 h-3 shrink-0 text-gray-500" />}
                   {isPublic ? 'Visible' : 'Encrypted'}
                </span>
             </div>
          </div>

          <div className="flex gap-4">
             <PremiumButton variant="glass" size="lg" className="rounded-full px-10 h-14 bg-white/5 border-white/10 hover:bg-white/10" onClick={() => navigate('/settings')}>
                <Settings className="w-5 h-5 mr-3" /> {t('settings')}
             </PremiumButton>
             <PremiumButton 
               variant="glass" 
               size="icon" 
               className="rounded-full w-14 h-14 border-white/10 relative overflow-visible"
               onClick={toggleLanguage}
             >
                <Globe className={cn("w-6 h-6 transition-all duration-500", language === 'ar' ? "text-primary scale-110 rotate-12" : "text-gray-400")} />
                <div className="absolute -bottom-1 -right-1 bg-primary text-white text-[8px] font-black px-1.5 py-0.5 rounded-md uppercase tracking-tighter shadow-lg">
                  {language}
                </div>
             </PremiumButton>
          </div>
        </div>
      </div>

      <div className="relative z-10 -mt-10 px-8 space-y-14">
         {/* Level Progress Dashboard */}
         <section className="space-y-6">
            <div className="flex items-center justify-between">
               <SectionHeader title="Experience" subtitle="SYNC PROGRESS TO NEXT TIER" />
               <span className="text-[10px] font-black text-primary italic uppercase tracking-widest">{stats.total} TOTAL UNITS</span>
            </div>
            <PremiumCard className="p-8 border-white/5 bg-gradient-to-br from-white/[0.03] to-transparent">
               <div className="space-y-6">
                  <div className="flex justify-between items-end">
                     <div>
                        <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest mb-1">Rank Progress</p>
                        <h4 className="text-xl font-black text-white italic tracking-tighter uppercase">Master Recon Tier</h4>
                     </div>
                     <span className="text-primary font-black italic">{(stats.progress * 100).toFixed(0)}%</span>
                  </div>
                  <div className="h-3 w-full bg-white/5 rounded-full overflow-hidden p-0.5">
                     <motion.div 
                       initial={{ width: 0 }}
                       animate={{ width: `${stats.progress * 100}%` }}
                       className="h-full bg-primary rounded-full shadow-[0_0_20px_rgba(var(--color-primary-rgb),1)]" 
                     />
                  </div>
               </div>
            </PremiumCard>
         </section>

         {/* Bento Stats Grid */}
         <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 grid grid-cols-3 gap-4">
               <div className="premium-glass p-6 rounded-[32px] border border-white/5 flex flex-col items-center justify-center space-y-2 group hover:bg-white/[0.03] transition-all">
                  <StatWidget label="MOVIES" value={stats.movies} color="text-primary" className="bg-transparent border-0 p-0 items-center justify-center" />
               </div>
               <div className="premium-glass p-6 rounded-[32px] border border-white/5 flex flex-col items-center justify-center space-y-2 group hover:bg-white/[0.03] transition-all">
                  <StatWidget label="SERIES" value={stats.series} color="text-accent" className="bg-transparent border-0 p-0 items-center justify-center" />
               </div>
               <div className="premium-glass p-6 rounded-[32px] border border-white/5 flex flex-col items-center justify-center space-y-2 group hover:bg-white/[0.03] transition-all">
                  <StatWidget label="GAMES" value={stats.games} color="text-purple-400" className="bg-transparent border-0 p-0 items-center justify-center" />
               </div>
            </div>
         </div>

         {/* Identity Badges - Technical Editorial Look */}
         <section className="space-y-8">
            <SectionHeader 
              title="Intelligence" 
              subtitle="EARNED DEPLOYMENT BADGES" 
              action={<Link to="/achievements" className="text-[10px] font-black text-primary uppercase tracking-widest italic group overflow-hidden">View Dossier <ChevronRight className="w-3 h-3 inline group-hover:translate-x-1 transition-transform" /></Link>}
            />
            <PremiumCard className="p-10 border-white/5 relative overflow-hidden">
               <div className="absolute top-0 right-0 p-4 opacity-[0.03] pointer-events-none">
                  <ShieldCheck className="w-48 h-48" />
               </div>
               <div className="relative z-10">
                  <Badges />
               </div>
            </PremiumCard>
         </section>

         {/* Friends Sync - Immersive List */}
         <section className="space-y-8">
            <SectionHeader title="Neural Net" subtitle="NETWORK CONNECTIONS" />
            <div className="premium-glass p-8 rounded-[48px] border border-white/5">
               <div className="flex items-center justify-between">
                  <div className="flex -space-x-5">
                     {friends.length > 0 ? (
                       friends.slice(0, 6).map(f => {
                         const friendProfile = f.sender_id === user?.id ? f.receiver : f.sender;
                         return (
                           <div key={f.id} className="relative group" onClick={() => navigate(`/user/${friendProfile?.username}`)}>
                              <motion.img 
                                whileHover={{ y: -8, zIndex: 50, scale: 1.1 }}
                                src={friendProfile?.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&q=80'} 
                                className="w-16 h-16 rounded-[24px] border-4 border-[#030308] bg-[#030308] grayscale hover:grayscale-0 transition-all cursor-pointer shadow-xl object-cover" 
                                alt="" 
                              />
                              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-primary w-2 h-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                           </div>
                         );
                       })
                     ) : (
                       <div className="flex items-center gap-3 text-gray-700">
                          <Users className="w-6 h-6" />
                          <span className="text-[10px] font-black uppercase tracking-[0.2em]">NO CONNECTIONS DETECTED</span>
                       </div>
                     )}
                     {friends.length > 6 && (
                       <div className="w-16 h-16 rounded-[24px] border-4 border-[#030308] bg-white/5 flex items-center justify-center text-[11px] font-black text-gray-500 backdrop-blur-xl">
                          +{friends.length - 6}
                       </div>
                     )}
                  </div>
                  <PremiumButton variant="glass" size="icon" className="rounded-2xl h-14 w-14 border-white/10 active:scale-90" onClick={() => navigate('/friends')}>
                     <Plus className="w-6 h-6 text-primary" />
                  </PremiumButton>
               </div>
            </div>
         </section>

         {/* Insights CTA - Refined Visual */}
         <motion.section 
           whileHover={{ y: -4 }}
           className="premium-glass p-12 rounded-[56px] border border-primary/20 relative overflow-hidden group cursor-pointer active:scale-[0.98] transition-all bg-gradient-to-br from-primary/10 via-transparent to-transparent shadow-2xl"
           onClick={() => navigate('/wrapped')}
         >
            <div className="absolute top-0 right-0 p-12 opacity-5 scale-150 rotate-12 group-hover:rotate-0 transition-transform duration-1000">
               <TrendingUp className="w-48 h-48 text-primary" />
            </div>
            <div className="relative z-10 space-y-6">
               <div className="inline-flex items-center gap-3 px-4 py-1.5 bg-primary/20 rounded-full border border-primary/30">
                  <Flame className="w-4 h-4 text-primary animate-pulse" />
                  <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Seasonal Analysis</span>
               </div>
               <h3 className="text-4xl font-black text-white italic leading-tight uppercase tracking-tighter">Transmission:<br /><span className="text-primary italic-none">Wrapped.</span></h3>
               <p className="text-base font-medium text-gray-500 max-w-[280px] leading-relaxed">
                 Access a high-fidelity data visualization of your media consumption footprint.
               </p>
               <div className="pt-4 flex items-center gap-4 text-white font-black text-sm uppercase tracking-widest group">
                  INITIALIZE RECAP <ChevronRight className="w-5 h-5 group-hover:translate-x-2 transition-transform text-primary" />
               </div>
            </div>
         </motion.section>
      </div>
    </div>
  );
}
