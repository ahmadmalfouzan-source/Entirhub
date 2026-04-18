import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { ContentCard } from '@/components/ContentCard';
import { User, Library as LibraryIcon, Lock } from 'lucide-react';

export function PublicProfile() {
  const { username } = useParams();
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
        // 1. Fetch profile by username
        // Simplified lookup as requested by user
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('username', username)
          .single();

        if (profileError) {
          console.error('Error fetching profile:', profileError);
          if (profileError.message.includes('is_public')) {
            setError('Database schema update required. Please add the "is_public" column to the profiles table.');
          } else {
            setError('User not found');
          }
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

        // 2. Fetch library
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
      <div className="min-h-screen bg-[#0a0f1e] flex items-center justify-center text-gray-400">
        Loading profile...
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0a0f1e] flex flex-col items-center justify-center p-8 text-center">
        {error === 'This profile is private' ? (
          <Lock className="w-16 h-16 text-gray-600 mb-4" />
        ) : (
          <User className="w-16 h-16 text-gray-600 mb-4" />
        )}
        <h1 className="text-2xl font-bold text-white mb-2">{error}</h1>
        <p className="text-gray-400 max-w-md">
          {error === 'This profile is private' 
            ? "The user has chosen to keep their library private." 
            : "We couldn't find the user you're looking for."}
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0f1e] text-white animate-in fade-in slide-in-from-bottom-4 duration-300 ease-in-out">
      <div className="p-8 space-y-12 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row items-center gap-8 bg-white/5 p-8 rounded-3xl border border-white/5">
          <div className="w-24 h-24 rounded-full overflow-hidden bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-3xl font-bold text-white shadow-xl">
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            ) : (
              profile.username?.[0]?.toUpperCase()
            )}
          </div>
          <div className="text-center md:text-left">
          <h1 className="text-3xl font-bold text-white mb-1">{profile.username}'s Library</h1>
          <p className="text-gray-400 flex items-center justify-center md:justify-start gap-2">
            <LibraryIcon className="w-4 h-4" />
            {watchlist.length} items in library
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
        {watchlist.map(item => (
          <div key={item.id} className="pointer-events-none">
            <ContentCard 
              item={{
                external_id: item.media?.external_id || '',
                media_type: item.media?.media_type || '',
                title: item.media?.title || 'Unknown',
                poster_url: item.media?.poster_url || '',
                rating: item.rating || 0,
                release_date: item.media?.release_date || '',
                genres: item.media?.genres || []
              }} 
            />
          </div>
        ))}
      </div>
    </div>
  </div>
);
}
