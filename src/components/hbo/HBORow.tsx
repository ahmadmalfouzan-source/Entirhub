import React, { useRef } from 'react';
import { HBOCard } from './HBOCard';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export function HBORow({ title, items }: { title: string, items: any[] }) {
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
    <div className="relative mb-12 group/row">
      <h2 className="text-white text-xl md:text-2xl font-bold mb-4 px-6 md:px-16 tracking-wide drop-shadow-md" style={{ fontFamily: 'Georgia, serif' }}>
        {title}
      </h2>
      
      <div className="relative">
        <button 
          onClick={() => scroll('left')}
          className="absolute left-0 top-0 bottom-0 z-40 bg-gradient-to-r from-[#0d0d0d] via-[#0d0d0d]/80 to-transparent hover:via-[#0d0d0d] w-16 flex items-center justify-center transition-opacity duration-300 opacity-0 group-hover/row:opacity-100 border-r border-[#8b00ff]/0 hover:border-[#8b00ff]/30"
        >
          <ChevronLeft className="w-8 h-8 text-white drop-shadow-lg" />
        </button>

        <div 
          ref={rowRef}
          className="grid grid-cols-2 sm:grid-cols-3 md:flex gap-4 md:gap-5 md:overflow-x-auto md:overflow-y-visible px-4 sm:px-6 md:px-16 pb-8 pt-2 md:scrollbar-hide scroll-smooth md:snap-x md:snap-mandatory"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {items.slice(0, 10).map((item, i) => (
            <div key={`${(item as any).id || (item as any).external_id}-${i}`} className="md:snap-start">
              <HBOCard item={item} />
            </div>
          ))}
        </div>
        
        <button 
          onClick={() => scroll('right')}
          className="absolute right-0 top-0 bottom-0 z-40 bg-gradient-to-l from-[#0d0d0d] via-[#0d0d0d]/80 to-transparent hover:via-[#0d0d0d] w-16 flex items-center justify-center transition-opacity duration-300 opacity-0 group-hover/row:opacity-100 border-l border-[#8b00ff]/0 hover:border-[#8b00ff]/30"
        >
          <ChevronRight className="w-8 h-8 text-white drop-shadow-lg" />
        </button>
      </div>
    </div>
  );
}
