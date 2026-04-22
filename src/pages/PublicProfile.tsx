import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { 
  GameCard, 
  SectionHeader, 
  PremiumCard, 
  Skeleton,
  PremiumBadge,
  PremiumButton
} from '@/components/premium';
import { User, Library as LibraryIcon, Lock, ShieldAlert } from 'lucide-react';
import { motion } from 'motion/react';

export function PublicProfile() {
  const { username } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [watchlist, setWatchlist] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPublicData = async () => {
      if (!username) return;
      setLoading(true);
      setError(null);

      try {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('username', username)
          .single();

        if (profileError) {
          setError('User not found');
          return;
        }

        if (!profileData) {
          setError('User not found');
          return;
        }

        if (!profileData.is_public) {
          setError('This profile is private');
          setProfile(profileData);
          return;
        }

        setProfile(profileData);

        const { data: libraryData, error: libraryError } = await supabase
          .from('user_library')
          .select(`
            id,
            status,
            rating,
            media:media_id (
              title,
              poster_url,
              media_type,
              rating_global,
              external_id,
              genres,
              release_date
            )
          `)
          .eq('user_id', profileData.id);

        if (libraryError) throw libraryError;
        setWatchlist(libraryData || []);
      } catch (err) {
        console.error('Error fetching public profile:', err);
        setError('Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    fetchPublicData();
  }, [username]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#030308] flex flex-col items-center justify-center space-y-8">
        <Skeleton variant="circle" className="w-32 h-32 rounded-[44px]" />
        <Skeleton variant="text" className="w-48 h-8" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#030308] flex flex-col items-center justify-center p-8 text-center space-y-10">
        <div className="w-32 h-32 rounded-[48px] bg-white/[0.02] border border-white/5 flex items-center justify-center">
          {error === 'This profile is private' ? (
            <Lock className="w-12 h-12 text-primary" />
          ) : (
            <ShieldAlert className="w-12 h-12 text-red-500" />
          )}
        </div>
        <div className="space-y-4">
          <h1 className="text-4xl font-black text-white italic tracking-tighter uppercase">{error}</h1>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-[0.2em] max-w-xs mx-auto leading-relaxed">
            {error === 'This profile is private' 
              ? "Access denied. Target has encrypted their navigation logs." 
              : "Neural scan failed. Biological signature not detected in database."}
          </p>
        </div>
        <PremiumButton variant="glass" className="rounded-2xl" onClick={() => navigate('/')}>
          RETURN TO BASE
        </PremiumButton>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#030308] text-white animate-in fade-in duration-700 pb-40">
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-0 right-0 h-96 bg-primary/10 blur-[120px] rounded-full opacity-50" />
      </div>

      <div className="relative z-10 pt-24 px-6 space-y-16">
        {/* Profile Identity */}
        <div className="flex flex-col md:flex-row items-center gap-8 bg-white/[0.02] p-10 rounded-[56px] border border-white/5 backdrop-blur-3xl shadow-2xl">
          <div className="relative">
            <div className="w-32 h-32 rounded-[40px] bg-gradient-to-br from-primary to-accent p-1">
              <div className="w-full h-full rounded-[36px] bg-[#030308] overflow-hidden">
                {profile.avatar_url ? (
                  <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-4xl font-black text-white italic">
                    {profile.username?.[0]?.toUpperCase()}
                  </div>
                )}
              </div>
            </div>
            <div className="absolute -bottom-2 -right-2 px-3 py-1 bg-primary rounded-xl text-[10px] font-black italic shadow-lg">
              SYNCED
            </div>
          </div>
          
          <div className="text-center md:text-left space-y-3">
            <h1 className="text-4xl font-black text-white italic tracking-tighter uppercase">{profile.username}</h1>
            <div className="flex items-center justify-center md:justify-start gap-4">
              <div className="flex items-center gap-2 text-gray-500">
                <LibraryIcon className="w-4 h-4 text-primary" />
                <span className="text-[10px] font-black uppercase tracking-widest">{watchlist.length} ARCHIVED UNITS</span>
              </div>
              <PremiumBadge text="PUBLIC SIGNAL" color="bg-green-500/10 text-green-500" />
            </div>
          </div>
        </div>

        {/* Library Grid */}
        <section className="space-y-8">
          <SectionHeader title="Synchronized Library" subtitle="REMOTE DATA ACCESS" />
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
            {watchlist.map(item => (
              <GameCard 
                key={item.id}
                title={item.media?.title || 'Unknown'} 
                poster={item.media?.poster_url || ''} 
                rating={item.rating || 0}
                onClick={() => navigate(`/content/${item.media?.external_id}`)}
              />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
