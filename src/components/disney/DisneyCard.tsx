import React from 'react';
import { MediaItem } from '@/services/api';
import { Link } from 'react-router-dom';

export function DisneyCard({ item }: { item: MediaItem }) {
  // Determine if content is "New" (e.g. released this year or very recently)
  const releaseYear = item.release_date ? parseInt(item.release_date.substring(0, 4)) : 0;
  const currentYear = new Date().getFullYear();
  const isNew = releaseYear >= currentYear - 1;

  return (
    <Link 
      to={`/content/${item.external_id || (item as any).id}`} 
      className="flex flex-col gap-2 group w-[130px] md:w-[160px] lg:w-[200px] shrink-0 cursor-pointer"
    >
      <div className="relative aspect-[2/3] rounded-2xl overflow-hidden border-[3px] border-[#1a1d29] shadow-lg transition-all duration-300 ease-out group-hover:scale-105 group-hover:border-white/60 group-hover:shadow-[0_0_20px_rgba(77,181,255,0.5)]">
        <img 
          src={item.poster_url} 
          alt={item.title}
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        {isNew && (
          <div className="absolute top-2 right-2 bg-[#0063e5] text-[#f9f9f9] text-[10px] font-bold px-2 py-0.5 rounded shadow-lg uppercase tracking-wider border border-white/20">
            New
          </div>
        )}
      </div>
      <div className="text-[#f9f9f9] text-sm md:text-base font-bold truncate px-1 drop-shadow-md">
        {item.title}
      </div>
    </Link>
  );
}
