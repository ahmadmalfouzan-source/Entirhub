import React, { useEffect, useState } from 'react';
import { useStore } from '@/store/useStore';
import { supabase } from '@/lib/supabase';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Film, Tv, Gamepad2, Star, Trophy, Calendar, Sparkles } from 'lucide-react';

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
      
      // Filter watchlist items added this year
      const thisYearItems = watchlist.filter(item => {
        if (!item.added_at) return false;
        return new Date(item.added_at).getFullYear() === currentYear;
      });

      const movies = thisYearItems.filter(i => i.media?.media_type === 'movie').length;
      const series = thisYearItems.filter(i => i.media?.media_type === 'series').length;
      const games = thisYearItems.filter(i => i.media?.media_type === 'game').length;

      // Calculate top genre
      const genreCounts: Record<string, number> = {};
      thisYearItems.forEach(item => {
        item.media?.genres?.forEach(g => {
          genreCounts[g] = (genreCounts[g] || 0) + 1;
        });
      });
      const topGenre = Object.entries(genreCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'None';

      // Find favorite item
      const favoriteItem = [...thisYearItems].sort((a, b) => (b.rating || 0) - (a.rating || 0))[0];

      // Fetch episodes watched this year
      let episodes = 0;
      const monthlyData = Array.from({ length: 12 }, (_, i) => ({
        name: new Date(0, i).toLocaleString('default', { month: 'short' }),
        count: 0
      }));

      try {
        const { data: watchedEps } = await supabase
          .from('watched_episodes')
          .select('created_at')
          .eq('user_id', user.id)
          .gte('created_at', `${currentYear}-01-01T00:00:00Z`)
          .lte('created_at', `${currentYear}-12-31T23:59:59Z`);

        if (watchedEps) {
          episodes = watchedEps.length;
          watchedEps.forEach(ep => {
            if (ep.created_at) {
              const month = new Date(ep.created_at).getMonth();
              monthlyData[month].count += 1;
            }
          });
        }
      } catch (error) {
        console.error('Error fetching episodes for wrapped:', error);
      }

      setStats({
        movies,
        series,
        games,
        episodes,
        topGenre,
        favoriteItem,
        monthlyData
      });
      setLoading(false);
    };

    fetchWrappedData();
  }, [user, watchlist]);

  if (loading) return <div className="p-8 text-white flex justify-center items-center h-screen">Loading your year in review...</div>;
  if (!stats) return <div className="p-8 text-white">No data available for this year.</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-black text-white p-4 md:p-8 pb-24 animate-in fade-in slide-in-from-bottom-4 duration-300 ease-in-out">
      <div className="max-w-4xl mx-auto space-y-8 md:space-y-12">
        
        <div className="text-center space-y-2 md:space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-1000">
          <div className="inline-flex items-center justify-center p-2 md:p-3 bg-white/10 rounded-full mb-2 md:mb-4">
            <Sparkles className="w-6 h-6 md:w-8 md:h-8 text-yellow-400" />
          </div>
          <h1 className="text-4xl md:text-7xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-pink-500 via-red-500 to-yellow-500">
            {new Date().getFullYear()} Wrapped
          </h1>
          <p className="text-lg md:text-xl text-purple-200">Your year in entertainment</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200">
          <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl md:rounded-3xl p-4 md:p-6 text-center transform hover:scale-105 transition-transform">
            <Film className="w-8 h-8 md:w-10 md:h-10 mx-auto mb-2 md:mb-4 text-pink-400" />
            <div className="text-3xl md:text-4xl font-bold mb-1 md:mb-2">{stats.movies}</div>
            <div className="text-xs md:text-sm text-pink-200 uppercase tracking-wider font-semibold">Movies</div>
          </div>
          <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl md:rounded-3xl p-4 md:p-6 text-center transform hover:scale-105 transition-transform">
            <Tv className="w-8 h-8 md:w-10 md:h-10 mx-auto mb-2 md:mb-4 text-purple-400" />
            <div className="text-3xl md:text-4xl font-bold mb-1 md:mb-2">{stats.series}</div>
            <div className="text-xs md:text-sm text-purple-200 uppercase tracking-wider font-semibold">Series</div>
          </div>
          <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl md:rounded-3xl p-4 md:p-6 text-center transform hover:scale-105 transition-transform">
            <Gamepad2 className="w-8 h-8 md:w-10 md:h-10 mx-auto mb-2 md:mb-4 text-blue-400" />
            <div className="text-3xl md:text-4xl font-bold mb-1 md:mb-2">{stats.games}</div>
            <div className="text-xs md:text-sm text-blue-200 uppercase tracking-wider font-semibold">Games</div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-300">
          <div className="bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl md:rounded-3xl p-6 md:p-8 flex flex-col justify-center items-center text-center shadow-2xl">
            <Trophy className="w-10 h-10 md:w-12 md:h-12 mb-2 md:mb-4 text-yellow-200" />
            <h3 className="text-lg md:text-xl font-medium text-red-100 mb-1 md:mb-2">Top Genre</h3>
            <div className="text-4xl md:text-5xl font-black text-white">{stats.topGenre}</div>
          </div>

          <div className="bg-gradient-to-br from-blue-600 to-indigo-800 rounded-2xl md:rounded-3xl p-6 md:p-8 flex flex-col justify-center items-center text-center shadow-2xl">
            <Calendar className="w-10 h-10 md:w-12 md:h-12 mb-2 md:mb-4 text-blue-200" />
            <h3 className="text-lg md:text-xl font-medium text-blue-100 mb-1 md:mb-2">Episodes Watched</h3>
            <div className="text-4xl md:text-5xl font-black text-white">{stats.episodes}</div>
          </div>
        </div>

        {stats.favoriteItem && (
          <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl md:rounded-3xl p-6 md:p-8 animate-in fade-in slide-in-from-bottom-16 duration-1000 delay-500">
            <h3 className="text-xl md:text-2xl font-bold mb-4 md:mb-6 flex items-center gap-2">
              <Star className="w-5 h-5 md:w-6 md:h-6 text-yellow-400 fill-current" />
              Favorite of the Year
            </h3>
            <div className="flex flex-col md:flex-row items-center gap-6 md:gap-8">
              <img 
                src={stats.favoriteItem.media?.poster_url} 
                alt={stats.favoriteItem.title}
                className="w-32 md:w-48 rounded-xl shadow-2xl transform md:rotate-2 hover:rotate-0 transition-transform"
              />
              <div className="text-center md:text-left">
                <h4 className="text-2xl md:text-4xl font-black mb-2">{stats.favoriteItem.title}</h4>
                <div className="flex items-center justify-center md:justify-start gap-2 text-yellow-400 text-lg md:text-xl font-bold mb-2 md:mb-4">
                  <Star className="w-5 h-5 md:w-6 md:h-6 fill-current" />
                  {stats.favoriteItem.rating}/5
                </div>
                <p className="text-base md:text-lg text-purple-200">
                  You rated this higher than anything else this year. Excellent taste!
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl md:rounded-3xl p-4 md:p-8 animate-in fade-in slide-in-from-bottom-16 duration-1000 delay-700">
          <h3 className="text-xl md:text-2xl font-bold mb-4 md:mb-8 text-center">Your Year in Episodes</h3>
          <div className="h-48 md:h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.monthlyData}>
                <XAxis dataKey="name" stroke="#a78bfa" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  cursor={{ fill: 'rgba(255,255,255,0.1)' }}
                  contentStyle={{ backgroundColor: '#1e1b4b', border: 'none', borderRadius: '8px', color: '#fff' }}
                />
                <Bar dataKey="count" fill="#d946ef" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
}
