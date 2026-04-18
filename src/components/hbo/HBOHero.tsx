import React, { useState, useEffect } from 'react';
import { MediaItem } from '@/services/api';
import { Play, Info } from 'lucide-react';
import { Link } from 'react-router-dom';

export function HBOHero({ items }: { items: MediaItem[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Limit to top 5
  const heroItems = items.slice(0, 5);

  useEffect(() => {
    if (heroItems.length === 0) return;
    
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % heroItems.length);
    }, 8000); // 8 seconds

    return () => clearInterval(interval);
  }, [heroItems.length]);

  if (heroItems.length === 0) return null;

  return (
    <div className="relative w-full h-[60vh] md:h-[70vh] min-h-[400px] md:min-h-[500px] overflow-hidden bg-[#0d0d0d] mb-6 md:mb-12 mt-[-1px]">
      {heroItems.map((item, index) => {
        const isActive = index === currentIndex;
        const bannerUrl = (item as any).backdrop_url || item.poster_url;
        
        return (
          <div
            key={(item as any).id || item.external_id}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out flex items-end md:items-center ${
              isActive ? 'opacity-100 z-10' : 'opacity-0 z-0'
            }`}
          >
            {/* Background Image */}
            <img 
              src={bannerUrl}
              alt={item.title}
              className="absolute inset-0 w-full h-full object-cover object-top"
              referrerPolicy="no-referrer"
            />
            
            {/* Overlays */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#0d0d0d] via-transparent to-transparent md:via-[#0d0d0d]/40" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#0d0d0d]/90 via-[#0d0d0d]/70 to-transparent md:from-[#0d0d0d] md:via-[#0d0d0d]/60" />
            <div className="absolute inset-0 shadow-[inset_0_0_120px_rgba(139,0,255,0.15)] pointer-events-none" /> {/* Subtle purple vignette */}

            {/* Content Container */}
            <div className="relative z-10 w-full px-4 md:px-16 pb-12 md:pb-0 pt-24 md:pt-0">
              <div className="max-w-3xl flex flex-col">
                {/* Meta Row */}
                <div className="flex items-center gap-2 md:gap-3 text-[#a3a3a3] text-xs md:text-sm mb-2 md:mb-4 font-medium tracking-wide">
                  {item.release_date && <span>{item.release_date.substring(0, 4)}</span>}
                  {item.media_type && (
                    <>
                      <span>•</span>
                      <span className="capitalize">{item.media_type}</span>
                    </>
                  )}
                  {item.genres && item.genres.length > 0 && (
                    <>
                      <span>•</span>
                      <span>{item.genres[0]}</span>
                    </>
                  )}
                </div>

                {/* Title */}
                <h1 className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-2 md:mb-6 leading-tight drop-shadow-2xl">
                  {item.title}
                </h1>
                
                {/* Description */}
                <p className="text-sm md:text-lg text-gray-300 drop-shadow-lg mb-4 md:mb-10 line-clamp-3 md:line-clamp-4 leading-relaxed max-w-2xl font-medium hidden sm:block">
                  {(item as any).overview || `Experience ${item.title} and more premium content streaming now on EntertainHub.`}
                </p>
                
                {/* Actions */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 md:gap-5 mt-2 md:mt-0">
                  <Link 
                    to={`/content/${item.external_id || (item as any).id}`}
                    className="flex items-center justify-center gap-2 bg-[#8b00ff] hover:bg-[#9d2bf5] text-white px-6 md:px-8 py-3 w-full sm:w-auto rounded font-bold text-sm md:text-lg transition-all duration-300 sm:hover:scale-105 shadow-[0_0_15px_rgba(139,0,255,0.4)] min-h-[44px]"
                  >
                    <Play className="w-4 h-4 md:w-6 md:h-6 fill-current" /> Watch Now
                  </Link>
                  <Link 
                    to={`/content/${item.external_id || (item as any).id}`}
                    className="flex items-center justify-center gap-2 bg-transparent border-2 border-white text-white px-6 md:px-8 py-3 w-full sm:w-auto rounded font-bold text-sm md:text-lg hover:bg-white hover:text-black transition-all duration-300 min-h-[44px]"
                  >
                    <Info className="w-4 h-4 md:w-6 md:h-6" /> More Info
                  </Link>
                </div>
              </div>
            </div>
          </div>
        );
      })}

      {/* Progress Indicators */}
      <div className="absolute bottom-4 md:bottom-6 left-4 md:left-16 flex gap-2 z-20">
        {heroItems.map((_, idx) => (
          <button 
            key={idx}
            onClick={() => setCurrentIndex(idx)}
            className={`h-1 rounded-full transition-all duration-300 min-h-[20px] min-w-[20px] flex items-center justify-center group focus:outline-none`}
            aria-label={`Go to slide ${idx + 1}`}
          >
             <div className={`h-1.5 md:h-1 rounded-full transition-all duration-300 ${idx === currentIndex ? 'w-8 bg-[#8b00ff] shadow-[0_0_8px_rgba(139,0,255,0.8)]' : 'w-4 bg-white/30 group-hover:bg-white/60'}`} />
          </button>
        ))}
      </div>
    </div>
  );
}
