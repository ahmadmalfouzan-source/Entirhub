import React from 'react';
import { PremiumCard } from './PremiumCard';
import { Trophy, Award, Lock, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AchievementCardProps {
  title: string;
  description: string;
  rarity?: 'common' | 'rare' | 'ultra' | 'platinum';
  isUnlocked: boolean;
  date?: string;
}

export const AchievementCard: React.FC<AchievementCardProps> = ({ 
  title, 
  description, 
  rarity = 'common', 
  isUnlocked,
  date 
}) => {
  const colors = {
    common: 'text-gray-400 bg-gray-400/10',
    rare: 'text-primary bg-primary/10',
    ultra: 'text-yellow-500 bg-yellow-500/10',
    platinum: 'text-blue-400 bg-blue-400/10 shadow-[0_0_20px_rgba(96,165,250,0.3)]',
  };

  return (
    <PremiumCard className={cn(
      "p-5 flex items-center gap-5 border-white/5",
      !isUnlocked && "opacity-50"
    )}>
      <div className={cn(
        "w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 border border-white/5",
        colors[rarity]
      )}>
        {rarity === 'platinum' ? <Trophy className="w-7 h-7" /> : <Award className="w-7 h-7" />}
      </div>

      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-black text-white italic truncate">{title.toUpperCase()}</h4>
          {isUnlocked ? (
             <CheckCircle2 className="w-4 h-4 text-primary" />
          ) : (
             <Lock className="w-4 h-4 text-gray-600" />
          )}
        </div>
        <p className="text-[10px] font-medium text-gray-500 leading-tight line-clamp-2">{description}</p>
        {isUnlocked && date && (
          <p className="text-[8px] font-black text-gray-600 uppercase tracking-widest pt-1">UNLOCKED {date}</p>
        )}
      </div>
    </PremiumCard>
  );
};
