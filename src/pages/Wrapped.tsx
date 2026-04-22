import React, { useEffect, useState } from 'react';
import { useStore } from '@/store/useStore';
import { supabase } from '@/lib/supabase';
import { BarChart, Bar, ResponsiveContainer, YAxis, Cell } from 'recharts';
import { Film, Tv, Gamepad2, Star, Trophy, Sparkles, Activity } from 'lucide-react';
import { motion } from 'motion/react';

interface WrappedStats {
  movies: number;
  series: number;
  games: number;
  episodes: number;
  topGenre: string;
  favoriteItem: any;
  monthlyData: { name: string; count: number }[];
}

export function Wrapped() {
  const { user, watchlist } = useStore();
  const [stats, setStats] = useState<WrappedStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWrappedData = async () => {
      if (!user) return;
      const currentYear = new Date().getFullYear();
      const thisYearItems = watchlist.filter(item => item.added_at && new Date(item.added_at).getFullYear() === currentYear);
      const movies = thisYearItems.filter(i => i.media?.media_type === 'movie').length;
      const series = thisYearItems.filter(i => i.media?.media_type === 'series').length;
      const games = thisYearItems.filter(i => i.media?.media_type === 'game').length;

      const genreCounts: Record<string, number> = {};
      thisYearItems.forEach(item => item.media?.genres?.forEach(g => genreCounts[g] = (genreCounts[g] || 0) + 1));
      const topGenre = Object.entries(genreCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Discovery';
      const favoriteItem = [...thisYearItems].sort((a, b) => (b.rating || 0) - (a.rating || 0))[0];

      const monthlyData = Array.from({ length: 12 }, (_, i) => ({ 
        name: new Date(0, i).toLocaleString('default', { month: 'short' }).toUpperCase(), 
        count: 0 
      }));

      try {
        const { data: watchedEps } = await supabase.from('watched_episodes').select('created_at').eq('user_id', user.id).gte('created_at', `${currentYear}-01-01T00:00:00Z`);
        if (watchedEps) watchedEps.forEach(ep => monthlyData[new Date(ep.created_at).getMonth()].count += 1);
      } catch (e) { console.error(e); }

      setStats({ movies, series, games, episodes: 0, topGenre, favoriteItem, monthlyData });
      setLoading(false);
    };
    fetchWrappedData();
  }, [user, watchlist]);

  if (loading) return <div className="min-h-screen bg-[#030308] flex items-center justify-center p-6"><div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  if (!stats) return <div className="p-8 text-gray-500 font-bold uppercase tracking-widest text-center">No data for this year</div>;

  return (
    <div className="flex flex-col min-h-screen bg-[#030308] pb-24 animate-in fade-in duration-500 overflow-x-hidden">
      {/* Header Splash */}
      <div className="relative pt-20 pb-16 px-6 overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-full bg-gradient-to-br from-primary/30 via-[#030308] to-transparent pointer-events-none" />
        <div className="relative z-10 space-y-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary fill-primary" />
              <span className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">YOUR ADVENTURE</span>
            </div>
            <h1 className="text-5xl font-black text-white italic leading-none drop-shadow-[0_0_20px_rgba(var(--color-primary-rgb),0.3)]">WRAPPED<span className="text-primary tracking-normal">.</span>24</h1>
        </div>
      </div>

      <div className="px-6 space-y-6">
        {/* Main Stat Hub */}
        <div className="grid grid-cols-2 gap-4">
          <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="premium-glass p-6 rounded-[40px] border border-white/5 col-span-2 flex items-center justify-between overflow-hidden relative">
            <div className="absolute right-0 bottom-0 p-4 opacity-5 pointer-events-none">
              <Trophy className="w-32 h-32" />
            </div>
            <div className="space-y-1">
              <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">MOST WATCHED GENRE</span>
              <h3 className="text-3xl font-black text-primary italic leading-none">{stats.topGenre}</h3>
            </div>
          </motion.div>

          {[
            { label: 'Movies', value: stats.movies, icon: Film, color: '#ff4b4b' },
            { label: 'Series', value: stats.series, icon: Tv, color: '#448aff' },
            { label: 'Games', value: stats.games, icon: Gamepad2, color: '#7c4dff' },
          ].map((item, idx) => (
             <motion.div key={item.label} initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: idx * 0.1 }} className="premium-glass p-6 rounded-[40px] border border-white/5 space-y-4">
               <item.icon className="w-6 h-6" style={{ color: item.color }} />
               <div className="space-y-1">
                  <div className="text-3xl font-black text-white leading-none">{item.value}</div>
                  <div className="text-[9px] font-black text-gray-500 uppercase tracking-widest">{item.label}</div>
               </div>
             </motion.div>
          ))}
          
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }} className="premium-glass p-6 rounded-[40px] border border-white/5 space-y-4 flex flex-col justify-end">
             <Activity className="w-6 h-6 text-green-400" />
             <div className="space-y-1">
                <div className="text-3xl font-black text-white leading-none">+{stats.monthlyData.reduce((acc, curr) => acc + curr.count, 0)}</div>
                <div className="text-[9px] font-black text-gray-500 uppercase tracking-widest">ACTIVITIES</div>
             </div>
          </motion.div>
        </div>

        {/* Favorite Spotlight */}
        {stats.favoriteItem && (
          <section className="space-y-4 pt-4">
            <h3 className="text-[10px] font-black text-white uppercase tracking-[0.3em] px-2 italic">YOUR MVP</h3>
            <div className="relative aspect-[16/9] rounded-[40px] overflow-hidden group">
              <img src={stats.favoriteItem.media?.poster_url} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700" alt="" />
              <div className="absolute inset-0 bg-gradient-to-t from-primary/80 via-primary/20 to-transparent" />
              <div className="absolute bottom-6 left-8 right-8">
                <span className="text-[9px] font-black text-[#030308] bg-white px-2 py-0.5 rounded uppercase tracking-widest mb-2 inline-block">HIGHEST RATED</span>
                <h4 className="text-2xl font-black text-white leading-tight italic truncate">{stats.favoriteItem.media?.title}</h4>
              </div>
            </div>
          </section>
        )}

        {/* Activity Chart */}
        <section className="space-y-4 pt-4">
          <h3 className="text-[10px] font-black text-white uppercase tracking-[0.3em] px-2 italic">ACTIVITY PULSE</h3>
          <div className="premium-glass p-8 rounded-[48px] border border-white/5 h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.monthlyData}>
                <YAxis hide />
                <Bar dataKey="count" radius={[4, 4, 4, 4]}>
                  {stats.monthlyData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.count > 0 ? '#ff3e3e' : '#1a1a24'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div className="flex justify-between px-2 mt-4">
              <span className="text-[8px] font-black text-gray-600 uppercase">JAN</span>
              <span className="text-[8px] font-black text-gray-600 uppercase">JUN</span>
              <span className="text-[8px] font-black text-gray-600 uppercase">DEC</span>
            </div>
          </div>
        </section>
      </div>

      <div className="px-10 py-12 text-center">
        <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest">Share your journey #EntertainHub24</p>
      </div>
    </div>
  );
}
