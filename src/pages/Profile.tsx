import React, { useEffect, useState } from 'react';
import { useStore } from '@/store/useStore';
import { supabase } from '@/lib/supabase';
import { 
  User, 
  Film, 
  Tv, 
  Gamepad2, 
  Clock, 
  Star, 
  TrendingUp,
  Calendar,
  ChevronRight,
  Share2,
  Globe,
  Lock,
  Award,
  Trophy
} from 'lucide-react';
import { ContentCard } from '@/components/ContentCard';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Badges } from '@/components/Badges';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '@/hooks/useTranslation';
import { fetchPSNProfile } from '@/services/psn';

interface Stats {
  totalMovies: number;
  totalSeries: number;
  totalGames: number;
  totalEpisodes: number;
  estimatedHours: number;
  topGenres: string[];
  recentItems: any[];
  favoriteRating: number;
}

interface PSNStats {
  totalTrophies: number;
  platinum: number;
}

export function Profile() {
  const { t } = useTranslation();
  const { user, watchlist, psnUsername } = useStore();
  const navigate = useNavigate();
  const [stats, setStats] = useState<Stats | null>(null);
  const [psnStats, setPsnStats] = useState<PSNStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPublic, setIsPublic] = useState(false);
  const [username, setUsername] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      const { data } = await supabase
        .from('profiles')
        .select('username, is_public')
        .eq('id', user.id)
        .single();
      
      if (data) {
        setUsername(data.username || user.email?.split('@')[0] || '');
        setIsPublic(data.is_public || false);
      } else {
        // Fallback if profile doesn't exist yet
        setUsername(user.email?.split('@')[0] || '');
      }
    };
    fetchProfile();
  }, [user]);

  useEffect(() => {
    const fetchPSN = async () => {
      if (!psnUsername) return;
      try {
        const data = await fetchPSNProfile(psnUsername);
        if (data && data.stats) {
          setPsnStats({
            totalTrophies: data.stats.totalTrophies || 0,
            platinum: data.stats.platinum || 0
          });
        }
      } catch (err) {
        console.error('Error fetching PSN stats:', err);
      }
    };
    fetchPSN();
  }, [psnUsername]);

  const handleShare = async () => {
    if (!user) return;
    
    try {
      const newStatus = !isPublic;
      const { error } = await supabase
        .from('profiles')
        .upsert({ 
          id: user.id, 
          is_public: newStatus,
          username: username // Ensure username is saved
        });

      if (error) throw error;
      
      setIsPublic(newStatus);
      
      if (newStatus) {
        const displayUsername = username.includes('@') ? username.split('@')[0] : username;
        const shareUrl = `${window.location.origin}/user/${displayUsername}`;
        await navigator.clipboard.writeText(shareUrl);
        toast.success('Library is now public!', {
          description: 'Share link copied to clipboard'
        });
      } else {
        toast.info('Library is now private');
      }
    } catch (error: any) {
      console.error('Error sharing library:', error);
      if (error.message?.includes("is_public")) {
        toast.error('Database schema update required', {
          description: 'Please run the SQL migration to add the "is_public" column to your profiles table.'
        });
      } else {
        toast.error('Failed to update sharing settings');
      }
    }
  };

  useEffect(() => {
    const fetchStats = async () => {
      if (!user) return;
      setLoading(true);

      try {
        // 1. Basic counts from watchlist
        const movies = watchlist.filter(i => i.media?.media_type === 'movie' && i.status === 'completed');
        const series = watchlist.filter(i => i.media?.media_type === 'series' && i.status === 'completed');
        const games = watchlist.filter(i => i.media?.media_type === 'game');

        // 2. Episode count
        const { count: episodeCount } = await supabase
          .from('episode_progress')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id);

        // 3. Estimated hours
        // Movies: 2h, Episodes: 45min (0.75h)
        const movieHours = movies.length * 2;
        const episodeHours = (episodeCount || 0) * 0.75;
        const totalHours = Math.round(movieHours + episodeHours);

        // 4. Top Genres
        const genreCounts: Record<string, number> = {};
        watchlist.forEach(item => {
          item.media?.genres?.forEach((g: string) => {
            genreCounts[g] = (genreCounts[g] || 0) + 1;
          });
        });
        const topGenres = Object.entries(genreCounts)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 3)
          .map(([name]) => name);

        // 5. Recent Items (last 5 added)
        const recent = [...watchlist]
          .sort((a, b) => new Date(b.added_at).getTime() - new Date(a.added_at).getTime())
          .slice(0, 5);

        // 6. Favorite Rating (most common)
        const ratingCounts: Record<number, number> = {};
        watchlist.forEach(item => {
          if (item.rating) {
            ratingCounts[item.rating] = (ratingCounts[item.rating] || 0) + 1;
          }
        });
        const favoriteRating = Object.entries(ratingCounts)
          .sort(([, a], [, b]) => b - a)[0]?.[0];

        setStats({
          totalMovies: movies.length,
          totalSeries: series.length,
          totalGames: games.length,
          totalEpisodes: episodeCount || 0,
          estimatedHours: totalHours,
          topGenres,
          recentItems: recent,
          favoriteRating: favoriteRating ? Number(favoriteRating) : 0
        });
      } catch (error) {
        console.error('Error fetching profile stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [user, watchlist]);

  if (loading || !stats) {
    return (
      <div className="p-8 space-y-8 animate-pulse">
        <div className="flex items-center gap-6">
          <div className="w-24 h-24 rounded-full bg-white/5" />
          <div className="space-y-2">
            <div className="h-8 w-48 bg-white/5 rounded" />
            <div className="h-4 w-32 bg-white/5 rounded" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-white/5 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-8 md:space-y-12 max-w-7xl mx-auto">
      {/* Profile Header */}
      <div className="flex flex-col md:flex-row items-center gap-6 md:gap-8 bg-gradient-to-br from-blue-600/20 to-purple-600/20 p-6 md:p-8 rounded-2xl md:rounded-3xl border border-white/5">
        <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-3xl md:text-4xl font-bold text-white shadow-2xl">
          {user?.email?.[0].toUpperCase()}
        </div>
        <div className="text-center md:text-left space-y-2 w-full md:w-auto">
          <h1 className="text-2xl md:text-4xl font-bold text-white truncate">{user?.email?.split('@')[0]}</h1>
          <p className="text-gray-400 flex items-center justify-center md:justify-start gap-2 text-sm md:text-base">
            <Calendar className="w-4 h-4" />
            {t('memberSince')} {new Date(user?.created_at || '').toLocaleDateString()}
          </p>
          <div className="flex flex-wrap justify-center md:justify-start gap-2 mt-4">
            {stats.topGenres.map(genre => (
              <span key={genre} className="px-3 py-1 bg-white/10 rounded-full text-xs font-medium text-blue-300 border border-white/10">
                {genre}
              </span>
            ))}
          </div>
        </div>
        <div className="md:ml-auto flex flex-col gap-3 w-full md:w-auto mt-4 md:mt-0">
          <Button 
            onClick={() => navigate('/wrapped')}
            className="bg-gradient-to-r from-pink-500 to-orange-400 hover:from-pink-600 hover:to-orange-500 text-white border-0 shadow-lg w-full md:w-auto"
          >
            <Star className="w-4 h-4 mr-2" />
            {t('myYearInReview')}
          </Button>
          <Button 
            onClick={handleShare}
            variant={isPublic ? "default" : "outline"}
            className={`w-full md:w-auto ${isPublic ? "bg-green-600 hover:bg-green-700" : "bg-white/20 text-white border border-white/30 hover:bg-white/30"}`}
          >
            {isPublic ? <Globe className="w-4 h-4 mr-2" /> : <Lock className="w-4 h-4 mr-2" />}
            {isPublic ? t('publicLibrary') : t('privateLibrary')}
          </Button>
          {isPublic && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-gray-400 hover:text-white w-full md:w-auto"
              onClick={() => {
                const displayUsername = username.includes('@') ? username.split('@')[0] : username;
                const shareUrl = `${window.location.origin}/user/${displayUsername}`;
                navigator.clipboard.writeText(shareUrl);
                toast.success('Link copied!');
              }}
            >
              <Share2 className="w-4 h-4 mr-2" />
              {t('copyShareLink')}
            </Button>
          )}
        </div>
      </div>

      {/* Badges Section */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-4 md:p-6">
        <div className="flex items-center gap-2 mb-4 md:mb-6">
          <Award className="w-5 h-5 text-yellow-500" />
          <h2 className="text-lg md:text-xl font-bold text-white">{t('achievements')}</h2>
        </div>
        <Badges />
      </div>

      {/* Stats Grid */}
      <div className="flex flex-col sm:grid sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <StatCard 
          icon={<Film className="w-6 h-6 text-blue-400" />}
          label={t('moviesWatched')}
          value={stats.totalMovies}
          subtext={t('completedSubtext')}
        />
        <StatCard 
          icon={<Tv className="w-6 h-6 text-purple-400" />}
          label={t('seriesCompleted')}
          value={stats.totalSeries}
          subtext={`${stats.totalEpisodes} ${t('episodes')}`}
        />
        <StatCard 
          icon={<Gamepad2 className="w-6 h-6 text-green-400" />}
          label={t('gamesTracked')}
          value={stats.totalGames}
          subtext={t('inLibrary')}
        />
        <StatCard 
          icon={<Clock className="w-6 h-6 text-orange-400" />}
          label={t('timeSpent')}
          value={`${stats.estimatedHours}h`}
          subtext={t('estimated')}
        />
        
        {psnStats && (
          <>
            <StatCard 
              icon={<Trophy className="w-6 h-6 text-blue-400" />}
              label="PSN Trophies"
              value={psnStats.totalTrophies}
              subtext="Total Earned"
            />
            <StatCard 
              icon={<Trophy className="w-6 h-6 text-cyan-400" />}
              label="Platinum Trophies"
              value={psnStats.platinum}
              subtext="100% Completed"
            />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Recent Activity */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
              <TrendingUp className="w-6 h-6 text-blue-400" />
              {t('recentActivity')}
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {stats.recentItems.map(item => (
              <div key={item.id} className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/5 hover:border-white/10 transition-colors group">
                <div className="w-16 h-24 rounded-lg overflow-hidden flex-shrink-0">
                  <img src={item.media?.poster_url} alt="" className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-white truncate">{item.media?.title}</h3>
                  <p className="text-xs text-gray-400 capitalize mb-2">{item.media?.media_type}</p>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                      item.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                      item.status === 'watching' ? 'bg-blue-500/20 text-blue-400' :
                      'bg-gray-500/20 text-gray-400'
                    }`}>
                      {t(item.status as any)}
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-600 group-hover:text-white transition-colors" />
              </div>
            ))}
          </div>
        </div>

        {/* Insights */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <Star className="w-6 h-6 text-yellow-400" />
            {t('insights')}
          </h2>
          <div className="bg-[#111827] border border-white/5 rounded-3xl p-8 space-y-8">
            <div className="space-y-4">
              <div className="flex justify-between items-end">
                <span className="text-gray-400 text-sm">{t('favoriteRating')}</span>
                <span className="text-3xl font-bold text-white flex items-center gap-2">
                  {stats.favoriteRating}
                  <Star className="w-6 h-6 text-yellow-400 fill-current" />
                </span>
              </div>
              <p className="text-xs text-gray-500 italic">
                {t('favoriteRatingDesc')}
              </p>
            </div>

            <div className="space-y-4">
              <h4 className="text-sm font-medium text-gray-300">{t('genreDistribution')}</h4>
              <div className="space-y-3">
                {stats.topGenres.map((genre, i) => (
                  <div key={genre} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-400">{genre}</span>
                      <span className="text-white">{100 - (i * 20)}%</span>
                    </div>
                    <Progress value={100 - (i * 20)} className="h-1.5" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, subtext }: { icon: React.ReactNode, label: string, value: string | number, subtext: string }) {
  return (
    <div className="bg-[#111827] border border-white/5 p-6 rounded-2xl hover:border-white/10 transition-all group">
      <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <div className="space-y-1">
        <p className="text-sm text-gray-400 font-medium">{label}</p>
        <p className="text-3xl font-bold text-white">{value}</p>
        <p className="text-xs text-gray-500">{subtext}</p>
      </div>
    </div>
  );
}
