import React from 'react';
import { cn } from '@/lib/utils';
import { PremiumCard } from './PremiumCard';
import { Star, MessageSquare, ThumbsUp, Play } from 'lucide-react';

interface ReviewCardProps {
  author: string;
  avatar?: string;
  rating: number;
  content: string;
  date: string;
  likes?: number;
}

export const ReviewCard: React.FC<ReviewCardProps> = ({ author, avatar, rating, content, date, likes = 0 }) => {
  return (
    <PremiumCard className="p-6 border-white/5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src={avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${author}`} className="w-10 h-10 rounded-2xl border border-white/10" alt="" />
          <div>
            <h4 className="text-sm font-black text-white italic">{author}</h4>
            <span className="text-[9px] font-black text-gray-600 uppercase tracking-widest">{date}</span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {[...Array(5)].map((_, i) => (
            <Star key={i} className={cn("w-3 h-3", i < rating ? "text-yellow-500 fill-current" : "text-white/10")} />
          ))}
        </div>
      </div>
      <p className="text-gray-400 text-sm font-medium leading-relaxed italic line-clamp-4">"{content}"</p>
      <div className="flex items-center gap-4 pt-2 border-t border-white/5">
        <div className="flex items-center gap-1.5 text-gray-600">
           <ThumbsUp className="w-3.5 h-3.5" />
           <span className="text-[10px] font-black">{likes}</span>
        </div>
        <div className="flex items-center gap-1.5 text-gray-600">
           <MessageSquare className="w-3.5 h-3.5" />
           <span className="text-[10px] font-black underline">REPLY</span>
        </div>
      </div>
    </PremiumCard>
  );
};

interface EpisodeCardProps {
  title: string;
  episodeNumber: number;
  seasonNumber: number;
  overview: string;
  airDate: string;
  onTrack: () => void;
  isWatched: boolean;
}

export const EpisodeCard: React.FC<EpisodeCardProps> = ({ title, episodeNumber, seasonNumber, overview, airDate, onTrack, isWatched }) => {
  return (
    <PremiumCard className="p-5 border-white/5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <span className="text-[9px] font-black text-primary uppercase tracking-[0.2em] italic">S{seasonNumber} EP{episodeNumber}</span>
          <h4 className="text-white font-black text-sm italic truncate max-w-[200px]">{title}</h4>
        </div>
        <button 
          onClick={onTrack}
          className={cn(
            "w-10 h-10 rounded-2xl flex items-center justify-center transition-all active:scale-90 border",
            isWatched ? "bg-primary/20 border-primary/40 text-primary" : "bg-white/5 border-white/10 text-gray-500"
          )}
        >
          <Play className={cn("w-4 h-4", isWatched && "fill-current")} />
        </button>
      </div>
      <p className="text-[11px] text-gray-500 font-medium leading-relaxed line-clamp-2">{overview || 'No overview available for this episode.'}</p>
      <div className="pt-2 border-t border-white/5">
        <span className="text-[8px] font-black text-gray-600 uppercase tracking-widest leading-none">AIRS {airDate}</span>
      </div>
    </PremiumCard>
  );
};
