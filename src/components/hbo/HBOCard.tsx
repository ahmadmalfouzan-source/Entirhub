import React from 'react';
import { Play, Plus, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import { MediaItem } from '@/services/api';

export function HBOCard({ item }: { item: MediaItem }) {
  const rating = item.rating || 0;
  const isPremium = rating >= 8.0;
  const year = item.release_date?.substring(0, 4);

  return (
    <Link
      to={`/content/${item.external_id || (item as any).id}`}
      className="group relative flex flex-col w-full md:w-[180px] lg:w-[220px] shrink-0 cursor-pointer rounded-lg overflow-hidden transition-all duration-300 hover:shadow-[0_0_30px_rgba(139,0,255,0.4)] md:hover:-translate-y-1 bg-[#1a1a1a]"
    >
      <div className="relative aspect-[2/3] w-full">
        <img
          src={item.poster_url}
          alt={item.title}
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
        {/* Permanent dark gradient at bottom */}
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-[#0d0d0d] via-black/40 to-transparent pointer-events-none" />
        
        {/* Premium Badge */}
        {isPremium && (
          <div className="absolute top-2 left-2 bg-gradient-to-br from-[#8b00ff] to-[#5a00a8] text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-[0_0_10px_rgba(139,0,255,0.5)] uppercase tracking-widest border border-white/20">
            Premium
          </div>
        )}

        {/* Default visible title context (optional, but good for UX if hover doesn't trigger) */}
        <div className="absolute bottom-0 left-0 right-0 p-3 opacity-100 group-hover:opacity-0 transition-opacity duration-300">
          <h3 className="text-white font-bold text-sm truncate drop-shadow-md">{item.title}</h3>
        </div>
      
        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-[#0d0d0d]/90 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4 md:p-5 backdrop-blur-[2px]">
          <div className="transform translate-y-6 group-hover:translate-y-0 transition-transform duration-300 ease-out">
            <h3 className="text-white font-bold text-sm md:text-base line-clamp-2 mb-2 leading-tight">{item.title}</h3>
            
            <div className="flex items-center gap-3 text-[11px] md:text-xs text-gray-300 mb-2 font-medium">
              {year && <span>{year}</span>}
              {rating > 0 && (
                <span className="flex items-center gap-1 text-white bg-white/10 px-1.5 py-0.5 rounded">
                  <Star className="w-3 h-3 text-[#8b00ff] fill-[#8b00ff]" />
                  {rating.toFixed(1)}
                </span>
              )}
            </div>
            
            {item.genres && item.genres.length > 0 && (
              <div className="text-[11px] md:text-xs text-[#b854ff] font-medium mb-5 truncate">
                {item.genres.join(' • ')}
              </div>
            )}
            
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 md:w-10 md:h-10 rounded-full bg-[#8b00ff] flex items-center justify-center text-white shadow-[0_0_15px_rgba(139,0,255,0.5)] hover:bg-white hover:text-[#8b00ff] transition-all hover:scale-110">
                <Play className="w-5 h-5 md:w-5 md:h-5 fill-current ml-0.5" />
              </div>
              <div className="w-11 h-11 md:w-10 md:h-10 rounded-full bg-white/10 flex items-center justify-center text-white border border-white/30 hover:bg-white hover:text-black transition-all hover:scale-110">
                <Plus className="w-5 h-5 md:w-5 md:h-5" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
