import React from 'react';
import { PremiumCard } from './PremiumCard';
import { Star, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

import { motion } from 'motion/react';

interface GameCardProps {
  title: string;
  poster: string;
  rating?: number | null;
  playtime?: number;
  platform?: string;
  status?: string;
  onClick?: () => void;
  variant?: 'compact' | 'featured';
}

const statusColors: Record<string, string> = {
  watching: 'bg-blue-500',
  completed: 'bg-green-500',
  plan_to_watch: 'bg-amber-500',
  dropped: 'bg-red-500'
};

const statusLabels: Record<string, string> = {
  watching: 'WATCHING',
  completed: 'COMPLETED',
  plan_to_watch: 'PLAN TO WATCH',
  dropped: 'DROPPED'
};

export const GameCard: React.FC<GameCardProps> = ({ 
  title, 
  poster, 
  rating, 
  playtime, 
  platform,
  status,
  onClick,
  variant = 'compact' 
}) => {
  return (
    <motion.div
      whileTap={{ scale: 0.96 }}
      whileHover={{ y: -6, scale: 1.02 }}
      className="w-full relative group"
    >
      <div className="absolute -inset-1 bg-gradient-to-r from-primary to-accent opacity-0 group-hover:opacity-30 blur-md transition-opacity duration-500 rounded-3xl z-0" />
      <PremiumCard 
        onClick={onClick}
        className={cn(
          "relative z-10 cursor-pointer overflow-hidden border-2 border-transparent group-hover:border-primary/20 shadow-lg group-hover:shadow-[0_10px_40px_rgba(var(--color-primary-rgb),0.3)] transition-all",
          variant === 'featured' ? "aspect-[16/9]" : "aspect-[2/3] w-[140px] md:w-[160px]"
        )}
      >
        <img 
          src={poster} 
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" 
          alt={title} 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#030308]/90 via-[#030308]/20 to-transparent group-hover:via-[#030308]/50 transition-all opacity-80 group-hover:opacity-100" />
        
        {/* Status Badge */}
        {status && statusLabels[status] && (
          <div className="absolute top-2 left-2 z-20">
            <span className={cn(
              "px-1.5 py-0.5 text-[8px] font-black tracking-widest text-white rounded-sm shadow-md",
              statusColors[status] || 'bg-gray-500'
            )}>
              {statusLabels[status]}
            </span>
          </div>
        )}

        {/* Quick Action Overlay on Hover */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="w-12 h-12 rounded-full bg-primary/80 backdrop-blur-md flex items-center justify-center text-white scale-75 group-hover:scale-100 transition-transform duration-500 shadow-xl">
             <span className="text-[10px] font-black tracking-widest ml-1">VIEW</span>
          </div>
        </div>

        <div className="absolute top-3 right-3 flex flex-col gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform translate-y-[-10px] group-hover:translate-y-0">
          {platform && (
            <Badge className="bg-primary backdrop-blur-md text-[8px] font-black uppercase tracking-widest border-white/10 shadow-lg">
              {platform}
            </Badge>
          )}
        </div>

        <div className="absolute bottom-4 left-4 right-4 space-y-2 transform transition-transform duration-500 group-hover:translate-y-[-4px]">
          <h4 className="text-white text-xs md:text-[13px] font-black tracking-tight leading-tight line-clamp-2 drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)]" title={title.toUpperCase()}>
            {title.toUpperCase()}
          </h4>
          <div className="flex items-center justify-between opacity-80 group-hover:opacity-100 transition-opacity">
            {rating && rating > 0 ? (
              <div className="flex items-center gap-1.5 bg-black/40 backdrop-blur-sm px-1.5 py-0.5 rounded-sm">
                <Star className="w-2.5 h-2.5 text-yellow-500 fill-current drop-shadow-md" />
                <span className="text-[10px] font-black text-white drop-shadow-md">{rating.toFixed(1)}</span>
              </div>
            ) : <div />}
            {playtime !== undefined && (
              <div className="flex items-center gap-1 text-gray-400 group-hover:text-primary transition-colors bg-black/40 backdrop-blur-sm px-1.5 py-0.5 rounded-sm">
                <Clock className="w-2.5 h-2.5" />
                <span className="text-[10px] font-black tracking-tighter">{playtime}H</span>
              </div>
            )}
          </div>
        </div>
      </PremiumCard>
    </motion.div>
  );
};
