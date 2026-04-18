import React, { useRef, useState } from 'react';
import { Play, Plus, Info, ChevronLeft, ChevronRight } from 'lucide-react';
import { MediaItem } from '@/services/api';

interface NetflixRowProps {
  title: string;
  items: MediaItem[];
}

export function NetflixRow({ title, items }: { title: string, items: any[] }) {
  const rowRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  const scroll = (direction: 'left' | 'right') => {
    if (rowRef.current) {
      const { scrollLeft, clientWidth } = rowRef.current;
      const scrollTo = direction === 'left' ? scrollLeft - clientWidth : scrollLeft + clientWidth;
      rowRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
    }
  };

  if (!items || items.length === 0) return null;

  return (
    <div 
      className="relative mb-8"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <h2 className="text-xl md:text-2xl font-bold text-[#e5e5e5] px-4 md:px-12 mb-3">
        {title}
      </h2>
      
      <div className="group relative">
        {/* Left Arrow */}
        <button 
          onClick={() => scroll('left')}
          className={`absolute left-0 top-0 bottom-0 z-40 bg-black/50 hover:bg-black/70 w-12 flex items-center justify-center transition-opacity duration-300 ${isHovered ? 'opacity-100' : 'opacity-0'}`}
        >
          <ChevronLeft className="w-8 h-8 text-white" />
        </button>

        {/* Scroll Container */}
        <div 
          ref={rowRef}
          className="flex gap-2 overflow-x-auto overflow-y-hidden px-4 md:px-12 pb-8 pt-4 scrollbar-hide scroll-smooth"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {items.map((item, i) => (
            <div 
              key={`${item.id}-${i}`}
              className="relative shrink-0 transition-transform duration-300 ease-in-out hover:scale-125 hover:z-50 origin-center cursor-pointer rounded-md shadow-sm hover:shadow-xl group/card"
              style={{ width: 'clamp(200px, 20vw, 300px)', aspectRatio: '16/9' }}
            >
              <img 
                src={item.backdrop_url || item.poster_url} 
                alt={item.title}
                className="w-full h-full object-cover rounded-md"
                referrerPolicy="no-referrer"
              />
              
              {/* Hover Details Card */}
              <div className="absolute top-full left-0 w-full bg-[#181818] p-4 rounded-b-md shadow-2xl opacity-0 group-hover/card:opacity-100 transition-opacity duration-300 -translate-y-2 pointer-events-none group-hover/card:pointer-events-auto">
                
                <h3 className="font-bold text-sm text-white line-clamp-1 mb-1">{item.title}</h3>
                
                <div className="flex items-center gap-2 text-xs mt-1 mb-2 font-medium">
                  <span className="text-[#46d369]">{item.rating > 0 ? `${Math.round(item.rating * 10)}% Match` : 'New'}</span>
                  <span className="text-gray-300">{item.release_date?.substring(0, 4) || 'TBA'}</span>
                  <span className="border border-gray-500 px-1 text-gray-300">HD</span>
                </div>

                {item.genres && item.genres.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-gray-400 mb-2">
                    {item.genres.slice(0, 3).map((genre, idx) => (
                      <React.Fragment key={genre}>
                        <span>{genre}</span>
                        {idx < Math.min(item.genres.length, 3) - 1 && <span className="text-gray-600">•</span>}
                      </React.Fragment>
                    ))}
                  </div>
                )}
                
                {item.overview && (
                  <p className="text-[10px] text-gray-300 line-clamp-2 mb-3 leading-snug">
                    {item.overview}
                  </p>
                )}

                <div className="flex items-center gap-2 mt-auto">
                  <button className="flex-1 flex items-center justify-center gap-1.5 bg-white text-black py-1.5 rounded-sm hover:bg-gray-200 transition font-bold text-xs">
                    <Plus className="w-3.5 h-3.5" /> My List
                  </button>
                  <button className="flex-1 flex items-center justify-center gap-1.5 bg-[#2a2a2a] text-white py-1.5 rounded-sm hover:bg-[#3f3f3f] transition font-bold text-xs">
                    <Info className="w-3.5 h-3.5" /> Info
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {/* Right Arrow */}
        <button 
          onClick={() => scroll('right')}
          className={`absolute right-0 top-0 bottom-0 z-40 bg-black/50 hover:bg-black/70 w-12 flex items-center justify-center transition-opacity duration-300 ${isHovered ? 'opacity-100' : 'opacity-0'}`}
        >
          <ChevronRight className="w-8 h-8 text-white" />
        </button>
      </div>
    </div>
  );
}
