import React, { useEffect, useState, useRef } from 'react';
import { cn } from '@/lib/utils';
import { 
  SectionHeader, 
  PremiumInput, 
  GameCard, 
  PremiumButton,
  StatWidget,
  Skeleton
} from '@/components/premium';
import { Search, RefreshCw, Trash2, CheckCircle2, ListFilter, Upload, Plus, Filter, SortAsc, X } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { useTranslation } from '@/hooks/useTranslation';
import { toast } from 'sonner';
import { importTitlesFromImage } from '@/services/importService';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { getDisplayTitle, getDisplayRating } from '@/lib/display';

type SortOption = 'date_added' | 'rating' | 'name' | 'year';

const GENRES = ['Action', 'Comedy', 'Drama', 'Horror', 'Sci-Fi', 'RPG', 'Adventure'];

export function Library() {
  const { watchlist, removeFromWatchlist, fetchWatchlist, user } = useStore();
  const [filter, setFilter] = useState('all');
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>('date_added');
  const [isSyncing, setIsSyncing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await fetchWatchlist();
      setLoading(false);
    };
    init();
  }, []);

  const handleDelete = async () => {
    if (selectedItems.size === 0) {
      setIsDeleting(false);
      return;
    }
    try {
      await Promise.all(Array.from(selectedItems).map((id: string) => removeFromWatchlist(id)));
      toast.success(`Deleted ${selectedItems.size} items`);
      setSelectedItems(new Set());
      setIsDeleting(false);
    } catch (error) {
      toast.error('Delete failed');
    }
  };

  const handleImageImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setIsSyncing(true);
    try {
      await importTitlesFromImage(file, user.id, (status: string) => toast.info(status));
      await fetchWatchlist();
      toast.success('Import completed');
    } catch (error) {
      toast.error('Import failed');
    } finally {
      setIsSyncing(false);
    }
  };

  const toggleSelection = (id: string) => {
    const newSelection = new Set(selectedItems);
    if (newSelection.has(id)) newSelection.delete(id);
    else newSelection.add(id);
    setSelectedItems(newSelection);
  };

  const filteredItems = watchlist
    .filter(item => {
      const matchType = filter === 'all' || item.media?.media_type === filter;
      const matchSearch = item.media?.title?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchGenre = !selectedGenre || item.media?.genres?.includes(selectedGenre);
      return matchType && matchSearch && matchGenre;
    })
    .sort((a, b) => {
      if (sortBy === 'name') return (a.media?.title || '').localeCompare(b.media?.title || '');
      if (sortBy === 'rating') return (b.rating || 0) - (a.rating || 0);
      return new Date(b.added_at).getTime() - new Date(a.added_at).getTime();
    });

  const gamesList = filteredItems.filter(item => item.media?.media_type === 'game');
  const mediaList = filteredItems.filter(item => item.media?.media_type !== 'game');

  const handleNavigate = (item: any) => {
    if (isDeleting) {
      toggleSelection(item.id);
      return;
    }
    // CRITICAL: Use external_id for navigation to ContentDetail
    const targetId = item.media?.external_id || item.media_id;
    navigate(`/content/${targetId}`);
  };

  if (loading) {
    return (
      <div className="p-6 pt-24 space-y-8 bg-[#030308] min-h-screen">
        <Skeleton variant="text" className="w-32 h-10" />
        <Skeleton variant="button" className="w-full h-14" />
        <div className="grid grid-cols-2 gap-4">
           {[1, 2, 3, 4].map(i => <Skeleton key={i} variant="card" className="h-64" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#030308] pb-40 animate-in fade-in duration-500">
      {/* Immersive Scroll Header */}
      <div className="sticky top-0 z-[100] bg-[#030308]/60 backdrop-blur-3xl border-b border-white/5 shadow-2xl">
        <div className="px-6 pt-6 pb-4 flex items-center justify-between">
          <motion.h1 initial={{ x: -10, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="text-2xl font-black text-white italic tracking-tighter">LIBRARY<span className="text-primary italic-none">.</span></motion.h1>
          <div className="flex items-center gap-2">
            <PremiumButton 
              variant={isDeleting ? 'neon' : 'glass'} 
              size="icon" 
              className={cn("rounded-2xl w-11 h-11 border-white/5 shadow-lg", isDeleting && "bg-red-500")}
              onClick={() => {
                setIsDeleting(!isDeleting);
                setSelectedItems(new Set());
              }}
            >
              <Trash2 className={cn("w-5 h-5", isDeleting ? "text-white" : "text-gray-400")} />
            </PremiumButton>
            <PremiumButton variant="glass" size="icon" className="rounded-2xl w-11 h-11 border-white/5 shadow-lg" onClick={() => fileInputRef.current?.click()}>
               <Upload className="w-5 h-5 text-gray-400" />
            </PremiumButton>
            <input type="file" hidden ref={fileInputRef} onChange={handleImageImport} accept="image/*" />
          </div>
        </div>

        {/* Search Input - Sticky focus */}
        <div className="px-6 mb-4">
           <PremiumInput 
             icon={Search} 
             placeholder="Search your collection..." 
             className="bg-white/[0.02] border-white/10"
             value={searchQuery}
             onChange={(e) => setSearchQuery(e.target.value)}
           />
        </div>

        {/* Improved Filter System */}
        <div className="flex flex-col gap-3 pb-6">
           <div className="flex gap-2 overflow-x-auto no-scrollbar px-6">
              {['all', 'movie', 'series', 'game'].map(type => (
                <button 
                  key={type} 
                  onClick={() => setFilter(type)}
                  className={cn(
                    "px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border transition-all shrink-0 active:scale-95",
                    filter === type 
                      ? "bg-primary border-primary text-white shadow-[0_10px_20px_rgba(var(--color-primary-rgb),0.3)]" 
                      : "bg-white/5 border-white/5 text-gray-500 hover:text-white"
                  )}
                >
                  {type}
                </button>
              ))}
           </div>
           
           <div className="flex gap-2 overflow-x-auto no-scrollbar px-6">
              <div className="flex items-center gap-2 pr-2 border-r border-white/10 shrink-0">
                 <Filter className="w-3 h-3 text-gray-600" />
              </div>
              {GENRES.map(genre => (
                 <button 
                   key={genre} 
                   onClick={() => setSelectedGenre(selectedGenre === genre ? null : genre)}
                   className={cn(
                     "px-4 py-1.5 rounded-xl text-[9px] font-bold uppercase tracking-widest border transition-all shrink-0",
                     selectedGenre === genre 
                       ? "bg-white text-black border-white" 
                       : "bg-transparent border-white/10 text-gray-400"
                   )}
                 >
                   {genre}
                 </button>
              ))}
           </div>
        </div>
      </div>

      {/* Main Content Sections */}
      <div className="px-6 py-10 space-y-16">
        {/* Games Section */}
        {gamesList.length > 0 && (
          <section className="space-y-8">
            <SectionHeader title="Tactical Assets" subtitle="GAMES & INTERACTIVE" />
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-5">
               <AnimatePresence mode="popLayout">
               {gamesList.map((item, idx) => (
                 <motion.div 
                   layout
                   key={item.id} 
                   initial={{ opacity: 0, scale: 0.8 }}
                   animate={{ opacity: 1, scale: 1 }}
                   exit={{ opacity: 0, scale: 0.8 }}
                   transition={{ duration: 0.3, delay: idx * 0.02 }}
                   className="relative group h-full"
                 >
                    <div onClick={() => isDeleting ? toggleSelection(item.id) : null} className="h-full">
                       <GameCard 
                         title={getDisplayTitle(item.media || item)} 
                         poster={item.media?.poster_url || ''} 
                         rating={getDisplayRating(item, item.rating)}
                         status={item.status}
                         onClick={() => handleNavigate(item)}
                       />
                    </div>
                    {isDeleting && (
                      <div 
                        onClick={() => toggleSelection(item.id)}
                        className={cn(
                          "absolute inset-0 z-20 flex items-center justify-center rounded-[32px] border-2 transition-all cursor-pointer bg-[#030308]/60 backdrop-blur-[2px]",
                          selectedItems.has(item.id) ? "border-primary bg-primary/20" : "border-white/20"
                        )}
                      >
                        <div className={cn(
                            "w-12 h-12 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300",
                            selectedItems.has(item.id) ? "bg-primary text-white scale-110" : "bg-white/10 text-white/40"
                        )}>
                           <CheckCircle2 className="w-7 h-7" />
                        </div>
                      </div>
                    )}
                 </motion.div>
               ))}
               </AnimatePresence>
            </div>
          </section>
        )}

        {/* Media Section */}
        {mediaList.length > 0 && (
          <section className="space-y-8">
            <SectionHeader title="Archive Records" subtitle="MOVIES & SERIES" />
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-5">
               <AnimatePresence mode="popLayout">
               {mediaList.map((item, idx) => (
                 <motion.div 
                   layout
                   key={item.id} 
                   initial={{ opacity: 0, scale: 0.8 }}
                   animate={{ opacity: 1, scale: 1 }}
                   exit={{ opacity: 0, scale: 0.8 }}
                   transition={{ duration: 0.3, delay: idx * 0.02 }}
                   className="relative group h-full"
                 >
                    <div onClick={() => isDeleting ? toggleSelection(item.id) : null} className="h-full">
                       <GameCard 
                         title={getDisplayTitle(item.media || item)} 
                         poster={item.media?.poster_url || ''} 
                         rating={getDisplayRating(item, item.rating)}
                         status={item.status}
                         onClick={() => handleNavigate(item)}
                       />
                    </div>
                    {isDeleting && (
                      <div 
                        onClick={() => toggleSelection(item.id)}
                        className={cn(
                          "absolute inset-0 z-20 flex items-center justify-center rounded-[32px] border-2 transition-all cursor-pointer bg-[#030308]/60 backdrop-blur-[2px]",
                          selectedItems.has(item.id) ? "border-primary bg-primary/20" : "border-white/20"
                        )}
                      >
                        <div className={cn(
                            "w-12 h-12 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300",
                            selectedItems.has(item.id) ? "bg-primary text-white scale-110" : "bg-white/10 text-white/40"
                        )}>
                           <CheckCircle2 className="w-7 h-7" />
                        </div>
                      </div>
                    )}
                 </motion.div>
               ))}
               </AnimatePresence>
            </div>
          </section>
        )}

        {filteredItems.length === 0 && (
           <div className="py-24 flex flex-col items-center justify-center text-center">
              <div className="w-24 h-24 rounded-[40px] bg-white/[0.02] border border-white/5 flex items-center justify-center mb-8">
                 <Search className="w-10 h-10 text-white/10" />
              </div>
              <h3 className="text-lg font-black text-white italic mb-2 uppercase tracking-tight">Vortex Discovered No Data<span className="text-primary italic-none">.</span></h3>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-[0.2em] mb-10 max-w-[240px] leading-relaxed">
                Your filters are too precise or your library is currently clear.
              </p>
              <PremiumButton variant="neon" size="lg" className="rounded-3xl shadow-2xl px-10" onClick={() => { setFilter('all'); setSearchQuery(''); setSelectedGenre(null); }}>
                 RESET FILTERS
              </PremiumButton>
           </div>
        )}
      </div>

      {/* Floating Action for Delete UX */}
      <AnimatePresence>
      {isDeleting && selectedItems.size > 0 && (
        <motion.div 
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-[110px] left-6 right-6 z-[120]"
        >
           <PremiumButton 
             fullWidth 
             variant="neon" 
             size="xl" 
             className="h-20 rounded-[32px] bg-red-600 shadow-[0_20px_50px_rgba(220,38,38,0.4)] border-red-500/50"
             onClick={handleDelete}
           >
             PURGE {selectedItems.size} ENTRIES
           </PremiumButton>
        </motion.div>
      )}
      </AnimatePresence>
    </div>
  );
}
