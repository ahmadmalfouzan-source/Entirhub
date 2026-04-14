import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useStore } from '@/store/useStore';
import { Film, Tv, Gamepad2, Trophy, Library, Star, Flame } from 'lucide-react';

interface BadgeDef {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
}

const BADGES: BadgeDef[] = [
  { id: 'first_watch', name: 'First Watch', description: 'Add your first movie to library', icon: Film },
  { id: 'binge_starter', name: 'Binge Starter', description: 'Watch 10 episodes total', icon: Tv },
  { id: 'gamer', name: 'Gamer', description: 'Add your first game to library', icon: Gamepad2 },
  { id: 'completionist', name: 'Completionist', description: 'Complete a game 100%', icon: Trophy },
  { id: 'librarian', name: 'Librarian', description: 'Add 20 items to library', icon: Library },
  { id: 'critic', name: 'Critic', description: 'Rate 10 items', icon: Star },
  { id: 'on_fire', name: 'On Fire', description: 'Watch 5 episodes in one day', icon: Flame },
];

export function Badges() {
  const { user, watchlist } = useStore();
  const [earnedBadges, setEarnedBadges] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkBadges = async () => {
      if (!user) return;
      
      const earned = new Set<string>();

      // Check Watchlist-based badges
      if (watchlist.some(w => w.media?.media_type === 'movie')) earned.add('first_watch');
      if (watchlist.some(w => w.media?.media_type === 'game')) earned.add('gamer');
      if (watchlist.some(w => w.media?.media_type === 'game' && w.is_completed_100)) earned.add('completionist');
      if (watchlist.length >= 20) earned.add('librarian');
      if (watchlist.filter(w => w.rating && w.rating > 0).length >= 10) earned.add('critic');

      // Check Episodes-based badges
      try {
        const { data: episodes } = await supabase
          .from('watched_episodes')
          .select('created_at')
          .eq('user_id', user.id);

        if (episodes) {
          if (episodes.length >= 10) earned.add('binge_starter');

          // Check On Fire (5 episodes in one day)
          const dateCounts: Record<string, number> = {};
          for (const ep of episodes) {
            if (ep.created_at) {
              const date = new Date(ep.created_at).toISOString().split('T')[0];
              dateCounts[date] = (dateCounts[date] || 0) + 1;
              if (dateCounts[date] >= 5) {
                earned.add('on_fire');
                break;
              }
            }
          }
        }
      } catch (error) {
        console.error('Error fetching episodes for badges:', error);
      }

      setEarnedBadges(earned);
      setLoading(false);
    };

    checkBadges();
  }, [user, watchlist]);

  if (loading) return <div className="animate-pulse h-24 bg-white/5 rounded-xl"></div>;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-4">
      {BADGES.map((badge) => {
        const isEarned = earnedBadges.has(badge.id);
        const Icon = badge.icon;
        return (
          <div 
            key={badge.id}
            className={`flex flex-col items-center p-4 rounded-xl border text-center transition-all ${
              isEarned 
                ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-500' 
                : 'bg-white/5 border-border text-muted-foreground opacity-50 grayscale'
            }`}
          >
            <div className={`p-3 rounded-full mb-3 ${isEarned ? 'bg-yellow-500/20' : 'bg-white/10'}`}>
              <Icon className="w-6 h-6" />
            </div>
            <h4 className={`font-semibold text-sm mb-1 ${isEarned ? 'text-yellow-500' : 'text-foreground'}`}>
              {badge.name}
            </h4>
            <p className="text-[10px] leading-tight">
              {badge.description}
            </p>
          </div>
        );
      })}
    </div>
  );
}
