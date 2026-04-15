import { useEffect, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ContentCard } from '@/components/ContentCard';
import { Library as LibraryIcon, Search, ListFilter } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { fetchSeasons, getWatchedEpisodes, getTotalProgress } from '@/services/episodes';
import { useTranslation } from '@/hooks/useTranslation';

interface ProgressData {
  watched: number;
  total: number;
  percent: number;
}

type SortOption = 'date_added' | 'rating' | 'name' | 'year';

export function Library() {
  const { watchlist, removeFromWatchlist } = useStore();
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState<SortOption>('date_added');
  const [progressMap, setProgressMap] = useState<Record<string, ProgressData>>({});
  const { t } = useTranslation();

  useEffect(() => {
    const fetchAllProgress = async () => {
      const seriesItems = watchlist.filter(item => item.media?.media_type === 'series');
      
      for (const item of seriesItems) {
        if (progressMap[item.media_id]) continue;

        try {
          const [{ seasons, number_of_episodes }, watched] = await Promise.all([
            fetchSeasons(item.media.external_id),
            getWatchedEpisodes(item.media_id)
          ]);

          const totalEpisodes = number_of_episodes || seasons.reduce((acc, s) => acc + s.episode_count, 0);
          const percent = totalEpisodes > 0 ? (watched.length / totalEpisodes) * 100 : 0;

          setProgressMap(prev => ({
            ...prev,
            [item.media_id]: {
              watched: watched.length,
              total: totalEpisodes,
              percent
            }
          }));
        } catch (error) {
          console.error(`Error fetching progress for ${item.media.title}:`, error);
        }
      }
    };

    if (watchlist.length > 0) {
      fetchAllProgress();
    }
  }, [watchlist]);

  const [visibleCount, setVisibleCount] = useState(20);

  useEffect(() => {
    setVisibleCount(20);
  }, [filter, sortBy]);

  const filteredItems = watchlist.filter(item => {
    if (filter === 'all') return true;
    if (filter === 'planned') return item.status === 'planned';
    if (filter === 'games' && item.media?.media_type === 'game') return true;
    if (filter === 'movies' && item.media?.media_type === 'movie') return true;
    if (filter === 'series' && item.media?.media_type === 'series') return true;
    return false;
  }).sort((a, b) => {
    if (sortBy === 'rating') {
      return (b.rating || 0) - (a.rating || 0);
    }
    if (sortBy === 'name') {
      return (a.media?.title || '').localeCompare(b.media?.title || '');
    }
    if (sortBy === 'year') {
      const yearA = a.media?.release_date ? new Date(a.media.release_date).getFullYear() : 0;
      const yearB = b.media?.release_date ? new Date(b.media.release_date).getFullYear() : 0;
      return yearB - yearA;
    }
    // default: date_added
    return new Date(b.added_at || 0).getTime() - new Date(a.added_at || 0).getTime();
  });

  const visibleItems = filteredItems.slice(0, visibleCount);

  return (
    <div className="p-4 md:p-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 md:mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
            <LibraryIcon className="w-5 h-5 md:w-6 md:h-6 text-white" />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-white">{t('myLibrary')}</h1>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="relative">
            <select 
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="appearance-none bg-[#111827] border border-white/10 text-white text-sm rounded-lg pl-10 pr-8 py-2 focus:outline-none focus:border-blue-500"
            >
              <option value="date_added">Recently Added</option>
              <option value="rating">Highest Rated</option>
              <option value="name">Name (A-Z)</option>
              <option value="year">Release Year</option>
            </select>
            <ListFilter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          </div>
        </div>
      </div>

      <Tabs defaultValue="all" className="w-full" onValueChange={setFilter}>
        <TabsList className="bg-[#111827] border border-white/10 mb-6 md:mb-8 flex flex-wrap h-auto p-1">
          <TabsTrigger value="all" className="data-[state=active]:bg-white/10 data-[state=active]:text-white flex-1 min-w-[70px] text-xs md:text-sm py-2">{t('all')}</TabsTrigger>
          <TabsTrigger value="planned" className="data-[state=active]:bg-white/10 data-[state=active]:text-white flex-1 min-w-[70px] text-xs md:text-sm py-2">Want to Watch</TabsTrigger>
          <TabsTrigger value="games" className="data-[state=active]:bg-white/10 data-[state=active]:text-white flex-1 min-w-[70px] text-xs md:text-sm py-2">{t('games')}</TabsTrigger>
          <TabsTrigger value="movies" className="data-[state=active]:bg-white/10 data-[state=active]:text-white flex-1 min-w-[70px] text-xs md:text-sm py-2">{t('movies')}</TabsTrigger>
          <TabsTrigger value="series" className="data-[state=active]:bg-white/10 data-[state=active]:text-white flex-1 min-w-[70px] text-xs md:text-sm py-2">{t('series')}</TabsTrigger>
        </TabsList>

        <div className="mt-0">
          {filteredItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
                <Search className="w-8 h-8 text-gray-500" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Nothing here yet</h3>
              <p className="text-gray-400 max-w-md">
                {filter === 'planned' 
                  ? "You haven't added anything to your 'Want to Watch' list yet."
                  : "Your library is empty. Start exploring and add some movies, series, or games!"}
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
                {visibleItems.map(item => (
                  <ContentCard 
                    key={item.id} 
                    item={{
                      id: item.id,
                      external_id: item.media?.external_id || '',
                      media_type: item.media?.media_type || '',
                      title: item.media?.title || 'Unknown Title',
                      poster_url: item.media?.poster_url || '',
                      rating: item.rating || 0,
                      release_date: item.media?.release_date || '',
                      genres: item.media?.genres || []
                    }} 
                    progress={progressMap[item.media_id]}
                    onDelete={removeFromWatchlist}
                  />
                ))}
              </div>
              {visibleCount < filteredItems.length && (
                <div className="mt-8 flex justify-center">
                  <button 
                    onClick={() => setVisibleCount(prev => prev + 20)}
                    className="px-6 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-white text-sm font-medium transition-colors"
                  >
                    Load More
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </Tabs>
    </div>
  );
}
