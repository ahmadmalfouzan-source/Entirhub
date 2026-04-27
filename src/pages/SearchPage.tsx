import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  PremiumInput, 
  GameCard, 
  Skeleton,
  PremiumButton
} from '@/components/premium';
import { Search, ArrowLeft } from 'lucide-react';
import { fetchGames, searchMedia, MediaItem } from '@/services/api';
import { useTranslation } from '@/hooks/useTranslation';
import { useLanguageStore } from '@/store/useLanguageStore';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';
import { getDisplayTitle, getDisplayRating } from '@/lib/display';

export function SearchPage() {
  const { t } = useTranslation();
  const { language } = useLanguageStore();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<MediaItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'movie' | 'series' | 'game'>('all');

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (query.trim()) {
        setIsSearching(true);
        const lang = language === 'ar' ? 'ar' : 'en-US';
        
        try {
          const [games, media] = await Promise.all([
            fetchGames(query),
            searchMedia(query)
          ]);
          
          let combined = [];
          if (activeTab === 'all' || activeTab === 'game') combined.push(...games);
          if (activeTab === 'all' || activeTab === 'movie') combined.push(...media.filter(m => m.media_type === 'movie'));
          if (activeTab === 'all' || activeTab === 'series') combined.push(...media.filter(m => m.media_type === 'series'));
          
          setResults(combined.sort((a, b) => (b.rating || 0) - (a.rating || 0)));
        } catch (e) {
          console.error("Search failed", e);
        } finally {
           setIsSearching(false);
        }
      } else {
        setResults([]);
      }
    }, 600);

    return () => clearTimeout(delayDebounceFn);
  }, [query, activeTab, language]);

  return (
    <div className="flex flex-col min-h-screen bg-[#030308] pb-40 animate-in fade-in duration-500">
      <div className="sticky top-0 z-[100] bg-[#030308]/90 backdrop-blur-3xl border-b border-white/5 pt-12 pb-6 px-6">
        <div className="flex items-center gap-4 mb-6">
           <PremiumButton variant="glass" size="icon" className="w-12 h-12 rounded-2xl shrink-0" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-5 h-5" />
           </PremiumButton>
           <PremiumInput 
             autoFocus
             icon={Search}
             placeholder="Search database..."
             value={query}
             onChange={(e) => setQuery(e.target.value)}
             className="bg-white/5 border-white/10"
           />
        </div>
        
        {/* Type Filter */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
           {['all', 'movie', 'series', 'game'].map(type => (
             <button 
               key={type} 
               onClick={() => setActiveTab(type as any)}
               className={cn(
                 "px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border transition-all shrink-0 active:scale-95",
                 activeTab === type 
                   ? "bg-primary border-primary text-white shadow-lg" 
                   : "bg-white/5 border-white/5 text-gray-500 hover:text-white"
               )}
             >
               {type}
             </button>
           ))}
        </div>
      </div>

      <div className="p-6">
        <AnimatePresence mode="wait">
          {isSearching ? (
             <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-5">
               {[...Array(8)].map((_, i) => <Skeleton key={i} variant="card" className="h-[240px]" />)}
             </motion.div>
          ) : query && results.length > 0 ? (
             <motion.div key="results" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-5">
               {results.map(item => (
                 <GameCard 
                   key={item.external_id || item.id} 
                   title={getDisplayTitle(item)} 
                   poster={item.poster_url} 
                   rating={getDisplayRating(item, item.rating)}
                   onClick={() => navigate(`/content/${item.media_type ? item.media_type + '_' : ''}${item.external_id || item.id}`)}
                 />
               ))}
             </motion.div>
          ) : query && !isSearching ? (
             <motion.div key="empty" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="text-center py-24">
                <Search className="w-12 h-12 text-white/10 mx-auto mb-4" />
                <h3 className="text-xl font-black text-white italic tracking-tight uppercase">No Results Found</h3>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mt-2">{query}</p>
             </motion.div>
          ) : (
             <motion.div key="initial" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center py-24 opacity-40">
                <Search className="w-16 h-16 text-primary mx-auto mb-4 drop-shadow-[0_0_15px_rgba(var(--color-primary-rgb),0.5)]" />
                <h3 className="text-xl font-black text-white italic tracking-tight uppercase">Enter Query</h3>
             </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
