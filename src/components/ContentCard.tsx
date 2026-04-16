import React from 'react';
import { Link } from 'react-router-dom';
import { Star, Plus, Check, Trophy, Clock, Share2, Trash2 } from 'lucide-react';
import { Badge } from './ui/badge';
import { useStore } from '@/store/useStore';
import { useTranslation } from '@/hooks/useTranslation';
import { toast } from 'sonner';

export interface ContentCardProps {
  key?: React.Key;
  item: {
    external_id: string;
    media_type: string;
    title: string;
    poster_url: string;
    rating: number;
    release_date: string;
    genres: string[];
    status?: string;
    next_episode_to_air?: any;
    id?: string; // Add id for deletion
  };
  progress?: {
    watched: number;
    total: number;
    percent: number;
  };
  onDelete?: (id: string) => void; // Add delete callback
}

export function ContentCard({ item, progress, onDelete }: ContentCardProps) {
  const { watchlist, addToWatchlist } = useStore();
  const { t } = useTranslation();
  const isInWatchlist = watchlist.some(w => w.media?.external_id === item.external_id);
  const watchlistItem = watchlist.find(w => w.media?.external_id === item.external_id);

  const handleAdd = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!isInWatchlist) {
      try {
        await addToWatchlist({
          external_id: item.external_id,
          media_type: item.media_type as any,
          status: 'planned',
          title: item.title,
          cover_url: item.poster_url,
        });
        toast.success(`${item.title} added to library`);
      } catch (error) {
        toast.error('Failed to add to library');
      }
    }
  };

  const handleShare = (e: React.MouseEvent) => {
    e.preventDefault();
    const url = `${window.location.origin}/content/${item.external_id}`;
    navigator.clipboard.writeText(url);
    toast.success('Link copied to clipboard!');
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    if (onDelete && item.id) {
      onDelete(item.id);
    }
  };

  const isAiring = item.media_type === 'series' && 
    (item.status === 'Returning Series' || item.next_episode_to_air !== null);

  return (
    <Link to={`/content/${item.external_id}`} className="group relative rounded-xl overflow-hidden bg-card border border-border hover:border-primary/50 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-primary/20 flex flex-row sm:flex-col h-36 sm:h-auto active:scale-[0.98]">
      <div className="aspect-[2/3] h-full sm:h-auto sm:w-full relative shrink-0">
        <img 
          src={item.poster_url || 'https://images.unsplash.com/photo-1616530940355-351fabd9524b?w=500&q=80'} 
          alt={item.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80" />
        
        <div className="absolute top-2 right-2 md:top-3 md:right-3 flex flex-col items-end gap-1 md:gap-2">
          {item.rating > 0 && (
            <div className="flex items-center gap-1 bg-black/60 backdrop-blur-md px-1.5 py-0.5 md:px-2 md:py-1 rounded-md text-xs md:text-sm font-medium text-yellow-400">
              <Star className="w-3 h-3 md:w-4 md:h-4 fill-current" />
              {item.rating.toFixed(1)}
            </div>
          )}
          {isAiring && (
            <div className="bg-green-500/20 text-green-400 text-[10px] md:text-xs px-2 py-0.5 rounded-full uppercase tracking-wider">
              {t('airing')}
            </div>
          )}
          {watchlistItem?.platform && (
            <div className="bg-blue-500/80 backdrop-blur-md px-1.5 py-0.5 md:px-2 md:py-0.5 rounded text-[10px] font-bold text-white uppercase tracking-wider">
              {watchlistItem.platform}
            </div>
          )}
          {watchlistItem?.is_completed_100 && (
            <div className="bg-yellow-500/80 backdrop-blur-md px-1.5 py-0.5 md:px-2 md:py-0.5 rounded text-[10px] font-bold text-white uppercase tracking-wider flex items-center gap-1">
              <Trophy className="w-3 h-3" />
              100%
            </div>
          )}
          {watchlistItem?.hours_played ? (
            <div className="bg-black/60 backdrop-blur-md px-1.5 py-0.5 md:px-2 md:py-0.5 rounded text-[10px] font-bold text-white uppercase tracking-wider flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {watchlistItem.hours_played}h
            </div>
          ) : null}
        </div>

        <div className="absolute top-3 left-3 hidden sm:flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
          <button 
            onClick={handleAdd}
            className={`w-8 h-8 rounded-full backdrop-blur-md flex items-center justify-center text-white transition-colors active:scale-90 ${isInWatchlist ? 'bg-primary' : 'bg-black/60 hover:bg-primary'}`}
          >
            {isInWatchlist ? <Check className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
          </button>
          <button 
            onClick={handleShare}
            className="w-8 h-8 rounded-full backdrop-blur-md flex items-center justify-center text-white bg-black/60 hover:bg-blue-500 transition-colors active:scale-90"
          >
            <Share2 className="w-4 h-4" />
          </button>
          {onDelete && item.id && (
            <button 
              onClick={handleDelete}
              className="w-8 h-8 rounded-full backdrop-blur-md flex items-center justify-center text-white bg-red-500/60 hover:bg-red-600 transition-colors active:scale-90"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <div className="p-3 md:p-4 flex-1 min-w-0 flex flex-col justify-center sm:justify-start relative">
        <h3 className="font-semibold text-foreground truncate mb-1 text-base md:text-lg pr-8 sm:pr-0">{item.title}</h3>
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-2 md:mb-3">
          {item.release_date && !isNaN(new Date(item.release_date).getTime()) ? (
            <span>{new Date(item.release_date).getFullYear()}</span>
          ) : <span />}
          <span className="capitalize">{item.media_type}</span>
        </div>

        {progress && (
          <div className="mt-auto sm:mt-2 space-y-1.5">
            <div className="flex justify-between text-xs font-medium">
              <span className="text-blue-400">{progress.watched}/{progress.total} eps</span>
              <span className="text-gray-400">{Math.round(progress.percent)}%</span>
            </div>
            <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-500 rounded-full transition-all duration-500 ease-out" 
                style={{ width: `${progress.percent}%` }}
              />
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-1 mt-2 md:mt-3">
          {item.genres?.slice(0, 2).map((genre) => (
            <Badge key={genre} variant="secondary" className="bg-white/5 text-gray-300 hover:bg-white/10 text-[10px] px-2 py-0.5">
              {genre}
            </Badge>
          ))}
        </div>

        {/* Mobile Action Buttons */}
        <div className="absolute bottom-3 right-3 flex sm:hidden gap-2 z-10">
          <button 
            onClick={handleAdd}
            className={`w-8 h-8 rounded-full flex items-center justify-center text-white transition-colors active:scale-90 ${isInWatchlist ? 'bg-primary' : 'bg-white/10 hover:bg-primary'}`}
          >
            {isInWatchlist ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          </button>
          <button 
            onClick={handleShare}
            className="w-8 h-8 rounded-full flex items-center justify-center text-white bg-white/10 hover:bg-blue-500 transition-colors active:scale-90"
          >
            <Share2 className="w-4 h-4" />
          </button>
          {onDelete && item.id && (
            <button 
              onClick={handleDelete}
              className="w-8 h-8 rounded-full flex items-center justify-center text-white bg-red-500/20 text-red-500 hover:bg-red-600 hover:text-white transition-colors active:scale-90"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </Link>
  );
}
