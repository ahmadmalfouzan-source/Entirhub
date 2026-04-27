import React from 'react';
import { PremiumCard } from './PremiumCard';
import { Sparkles, Play, Plus } from 'lucide-react';
import { PremiumButton } from './PremiumButton';

interface RecommendationCardProps {
  title: string;
  poster: string;
  reason: string;
  mediaType: string;
  rating: number;
  onExplore: () => void;
  onAdd: () => void;
}

export const RecommendationCard: React.FC<RecommendationCardProps> = ({
  title,
  poster,
  reason,
  mediaType,
  rating,
  onExplore,
  onAdd
}) => {
  return (
    <PremiumCard className="relative overflow-hidden aspect-[4/5] md:aspect-[16/9] max-h-[70vh] rounded-[48px] border-white/5 group shadow-2xl shrink-0">
      <img src={poster} className="absolute inset-0 z-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" alt="" />
      <div className="absolute inset-0 z-10 bg-gradient-to-t from-black/60 via-black/20 to-transparent pointer-events-none" />
      
      <div className="absolute z-20 bottom-8 left-6 right-6 md:bottom-10 md:left-8 md:right-8 space-y-4 md:space-y-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary fill-primary drop-shadow-md" />
            <span className="text-[10px] font-black text-primary uppercase tracking-[0.25em] drop-shadow-md">{reason}</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-black text-white leading-tight drop-shadow-[0_4px_8px_rgba(0,0,0,0.8)]">{title}</h2>
          <div className="flex items-center gap-3 mt-2">
             <span className="text-[10px] font-black text-white uppercase tracking-widest border border-white/20 px-2 py-0.5 rounded-sm bg-black/60 backdrop-blur-md shadow-lg">{mediaType}</span>
             {rating && rating > 0 ? (
               <span className="text-[10px] font-black text-yellow-400 bg-black/60 px-2 py-0.5 rounded-sm backdrop-blur-md shadow-lg">★ {rating.toFixed(1)}</span>
             ) : null}
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <PremiumButton variant="white" onClick={onExplore} className="flex-1 rounded-3xl h-12 md:h-14">
            <Play className="w-4 h-4 " /> EXPLORE
          </PremiumButton>
          <PremiumButton variant="glass" onClick={onAdd} className="w-12 h-12 md:w-14 md:h-14 rounded-3xl p-0 bg-black/40 backdrop-blur-md border-white/20">
            <Plus className="w-5 h-5 md:w-6 md:h-6" />
          </PremiumButton>
        </div>
      </div>
    </PremiumCard>
  );
};
