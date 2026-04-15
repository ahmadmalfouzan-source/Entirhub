import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useStore } from '@/store/useStore';
import { Film, Tv, Gamepad2, Trophy, Library, Star, Flame } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';

interface BadgeDef {
  id: string;
  nameKey: string;
  descKey: string;
  icon: React.ElementType;
}

const BADGES: BadgeDef[] = [
  { id: 'first_watch', nameKey: 'badgeFirstWatch', descKey: 'descFirstWatch', icon: Film },
  { id: 'binge_starter', nameKey: 'badgeBingeStarter', descKey: 'descBingeStarter', icon: Tv },
  { id: 'gamer', nameKey: 'badgeGamer', descKey: 'descGamer', icon: Gamepad2 },
  { id: 'completionist', nameKey: 'badgeCompletionist', descKey: 'descCompletionist', icon: Trophy },
  { id: 'librarian', nameKey: 'badgeLibrarian', descKey: 'descLibrarian', icon: Library },
  { id: 'critic', nameKey: 'badgeCritic', descKey: 'descCritic', icon: Star },
  { id: 'on_fire', nameKey: 'badgeOnFire', descKey: 'descOnFire', icon: Flame },
];

export function Badges() {
  const { t } = useTranslation();
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
              {t(badge.nameKey as any)}
            </h4>
            <p className="text-[10px] leading-tight">
              {t(badge.descKey as any)}
            </p>
          </div>
        );
      })}
    </div>
  );
}
