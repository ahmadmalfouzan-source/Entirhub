import React, { useRef } from 'react';
import { DisneyCard } from './DisneyCard';
import { MediaItem } from '@/services/api';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export function DisneyRow({ title, items }: { title: string, items: any[] }) {
  const rowRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (rowRef.current) {
      const { scrollLeft, clientWidth } = rowRef.current;
      const scrollTo = direction === 'left' ? scrollLeft - clientWidth : scrollLeft + clientWidth;
      rowRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
    }
  };

  if (!items || items.length === 0) return null;

  return (
    <div className="relative mb-8 md:mb-12 group/row">
      <h2 className="text-[#f9f9f9] text-xl md:text-2xl font-bold mb-4 px-4 md:px-12 tracking-wide">
        {title}
      </h2>
      
      <div className="relative">
        <button 
          onClick={() => scroll('left')}
          className="absolute left-0 top-0 bottom-0 z-40 bg-black/60 hover:bg-black/80 w-12 flex items-center justify-center transition-opacity duration-300 opacity-0 group-hover/row:opacity-100"
        >
          <ChevronLeft className="w-8 h-8 text-white" />
        </button>

        <div 
          ref={rowRef}
          className="flex gap-4 md:gap-5 overflow-x-auto overflow-y-visible px-4 md:px-12 pb-8 pt-4 scrollbar-hide scroll-smooth snap-x snap-mandatory"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {items.map((item, i) => (
            <div key={`${item.id || item.external_id}-${i}`} className="snap-start py-2">
              <DisneyCard item={item} />
            </div>
          ))}
        </div>
        
        <button 
          onClick={() => scroll('right')}
          className="absolute right-0 top-0 bottom-0 z-40 bg-black/60 hover:bg-black/80 w-12 flex items-center justify-center transition-opacity duration-300 opacity-0 group-hover/row:opacity-100"
        >
          <ChevronRight className="w-8 h-8 text-white" />
        </button>
      </div>
    </div>
  );
}
