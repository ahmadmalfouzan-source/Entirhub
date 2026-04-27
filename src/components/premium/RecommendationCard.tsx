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
    <PremiumCard className="aspect-[4/5] rounded-[48px] border-white/5 group shadow-2xl">
      <img src={poster} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" alt="" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#030308] via-[#030308]/40 to-transparent" />
      
      <div className="absolute bottom-10 left-8 right-8 space-y-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary fill-primary drop-shadow-md" />
            <span className="text-[10px] font-black text-primary uppercase tracking-[0.25em] drop-shadow-md">{reason}</span>
          </div>
          <h2 className="text-3xl font-black text-white leading-tight drop-shadow-2xl italic">{title}</h2>
          <div className="flex items-center gap-3">
             <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest drop-shadow-md border border-white/20 px-2 py-0.5 rounded-sm bg-black/40 backdrop-blur-sm">{mediaType}</span>
             <span className="text-[10px] font-black text-yellow-400 drop-shadow-md bg-black/40 px-2 py-0.5 rounded-sm backdrop-blur-sm">★ {rating.toFixed(1)}</span>
          </div>
        </div>

        <div className="flex gap-3">
          <PremiumButton variant="white" onClick={onExplore} className="flex-1 rounded-3xl h-14">
            <Play className="w-4 h-4 fill-current" /> EXPLORE
          </PremiumButton>
          <PremiumButton variant="glass" onClick={onAdd} className="w-14 h-14 rounded-3xl p-0">
            <Plus className="w-6 h-6" />
          </PremiumButton>
        </div>
      </div>
    </PremiumCard>
  );
};
