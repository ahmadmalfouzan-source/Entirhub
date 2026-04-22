import React from 'react';
import { PremiumCard } from './PremiumCard';
import { Star, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

import { motion } from 'motion/react';

interface GameCardProps {
  title: string;
  poster: string;
  rating?: number;
  playtime?: number;
  platform?: string;
  onClick?: () => void;
  variant?: 'compact' | 'featured';
}

export const GameCard: React.FC<GameCardProps> = ({ 
  title, 
  poster, 
  rating, 
  playtime, 
  platform, 
  onClick,
  variant = 'compact' 
}) => {
  return (
    <motion.div
      whileTap={{ scale: 0.96 }}
      whileHover={{ y: -8 }}
      className="w-full"
    >
      <PremiumCard 
        onClick={onClick}
        className={cn(
          "group cursor-pointer overflow-hidden",
          variant === 'featured' ? "aspect-[16/9]" : "aspect-[2/3] w-full"
        )}
      >
        <img 
          src={poster} 
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-125" 
          alt={title} 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#030308] via-[#030308]/20 to-transparent group-hover:via-[#030308]/40 transition-all" />
        
        <div className="absolute top-4 left-4 flex flex-col gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform translate-y-[-10px] group-hover:translate-y-0">
          {platform && (
            <Badge className="bg-primary backdrop-blur-md text-[8px] font-black uppercase tracking-widest border-white/10 shadow-lg">
              {platform}
            </Badge>
          )}
        </div>

        <div className="absolute bottom-5 left-5 right-5 space-y-2 transform transition-transform duration-500 group-hover:translate-y-[-4px]">
          <h4 className="text-white text-[13px] font-black tracking-tight leading-tight truncate drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
            {title.toUpperCase()}
          </h4>
          <div className="flex items-center justify-between opacity-80 group-hover:opacity-100 transition-opacity">
            <div className="flex items-center gap-1.5">
              <Star className="w-3 h-3 text-yellow-500 fill-current" />
              <span className="text-[11px] font-black text-white">{rating?.toFixed(1) || 'N/A'}</span>
            </div>
            {playtime !== undefined && (
              <div className="flex items-center gap-1 text-gray-400 group-hover:text-primary transition-colors">
                <Clock className="w-3 h-3" />
                <span className="text-[11px] font-black tracking-tighter">{playtime}H</span>
              </div>
            )}
          </div>
        </div>
      </PremiumCard>
    </motion.div>
  );
};
