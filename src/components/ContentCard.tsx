import React from 'react';
import { Link } from 'react-router-dom';
import { Star, Plus, Check, Trophy, Clock } from 'lucide-react';
import { Badge } from './ui/badge';
import { useStore } from '@/store/useStore';

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
  };
  progress?: {
    watched: number;
    total: number;
    percent: number;
  };
}

export function ContentCard({ item, progress }: ContentCardProps) {
  const { watchlist, addToWatchlist } = useStore();
  const isInWatchlist = watchlist.some(w => w.media?.external_id === item.external_id);
  const watchlistItem = watchlist.find(w => w.media?.external_id === item.external_id);

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!isInWatchlist) {
      addToWatchlist({
        external_id: item.external_id,
        media_type: item.media_type as any,
        status: 'planned',
        title: item.title,
        cover_url: item.poster_url,
      });
    }
  };

  const isAiring = item.media_type === 'series' && 
    item.release_date && 
    (new Date().getFullYear() - new Date(item.release_date).getFullYear()) <= 2;

  return (
    <Link to={`/content/${item.external_id}`} className="group relative rounded-xl overflow-hidden bg-card border border-border hover:border-primary/50 transition-all duration-300 hover:-translate-y-1">
      <div className="aspect-[2/3] relative">
        <img 
          src={item.poster_url || 'https://images.unsplash.com/photo-1616530940355-351fabd9524b?w=500&q=80'} 
          alt={item.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80" />
        
        <div className="absolute top-3 right-3 flex flex-col items-end gap-2">
          <div className="flex items-center gap-1 bg-black/60 backdrop-blur-md px-2 py-1 rounded-md text-sm font-medium text-yellow-400">
            <Star className="w-4 h-4 fill-current" />
            {item.rating?.toFixed(1) || 'N/A'}
          </div>
          {isAiring && (
            <div className="bg-green-500/80 backdrop-blur-md px-2 py-0.5 rounded text-[10px] font-bold text-white uppercase tracking-wider">
              Airing
            </div>
          )}
          {watchlistItem?.platform && (
            <div className="bg-blue-500/80 backdrop-blur-md px-2 py-0.5 rounded text-[10px] font-bold text-white uppercase tracking-wider">
              {watchlistItem.platform}
            </div>
          )}
          {watchlistItem?.is_completed_100 && (
            <div className="bg-yellow-500/80 backdrop-blur-md px-2 py-0.5 rounded text-[10px] font-bold text-white uppercase tracking-wider flex items-center gap-1">
              <Trophy className="w-3 h-3" />
              100%
            </div>
          )}
          {watchlistItem?.hours_played ? (
            <div className="bg-black/60 backdrop-blur-md px-2 py-0.5 rounded text-[10px] font-bold text-white uppercase tracking-wider flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {watchlistItem.hours_played}h
            </div>
          ) : null}
        </div>

        <button 
          onClick={handleAdd}
          className={`absolute top-3 left-3 w-8 h-8 rounded-full backdrop-blur-md flex items-center justify-center text-white transition-colors opacity-0 group-hover:opacity-100 ${isInWatchlist ? 'bg-primary' : 'bg-black/60 hover:bg-primary'}`}
        >
          {isInWatchlist ? <Check className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
        </button>
      </div>

      <div className="p-4">
        <h3 className="font-semibold text-foreground truncate mb-1">{item.title}</h3>
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
          {item.release_date && !isNaN(new Date(item.release_date).getTime()) ? (
            <span>{new Date(item.release_date).getFullYear()}</span>
          ) : <span />}
          <span className="capitalize">{item.media_type}</span>
        </div>

        {progress && (
          <div className="mt-2 space-y-1.5">
            <div className="flex justify-between text-[10px] font-medium">
              <span className="text-blue-400">{progress.watched}/{progress.total} eps</span>
              <span className="text-gray-400">{Math.round(progress.percent)}%</span>
            </div>
            <div className="h-1 bg-white/10 rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-500 rounded-full transition-all duration-500" 
                style={{ width: `${progress.percent}%` }}
              />
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-1 mt-3">
          {item.genres?.slice(0, 2).map((genre) => (
            <Badge key={genre} variant="secondary" className="bg-white/5 text-gray-300 hover:bg-white/10 text-[10px] px-1.5 py-0">
              {genre}
            </Badge>
          ))}
        </div>
      </div>
    </Link>
  );
}
