import { useEffect, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ContentCard } from '@/components/ContentCard';
import { Library as LibraryIcon } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { fetchSeasons, getWatchedEpisodes, getTotalProgress } from '@/services/episodes';

interface ProgressData {
  watched: number;
  total: number;
  percent: number;
}

export function Library() {
  const { watchlist } = useStore();
  const [filter, setFilter] = useState('all');
  const [progressMap, setProgressMap] = useState<Record<string, ProgressData>>({});

  useEffect(() => {
    const fetchAllProgress = async () => {
      const seriesItems = watchlist.filter(item => item.media?.media_type === 'series');
      
      for (const item of seriesItems) {
        if (progressMap[item.media_id]) continue;

        try {
          const [seasons, watched] = await Promise.all([
            fetchSeasons(item.media.external_id),
            getWatchedEpisodes(item.media_id)
          ]);

          const totalEpisodes = seasons.reduce((acc, s) => acc + s.episode_count, 0);
          const percent = getTotalProgress(watched, seasons);

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

  const filteredItems = watchlist.filter(item => {
    if (filter === 'all') return true;
    if (filter === 'games' && item.media?.media_type === 'game') return true;
    if (filter === 'movies' && item.media?.media_type === 'movie') return true;
    if (filter === 'series' && item.media?.media_type === 'series') return true;
    return false;
  });

  return (
    <div className="p-4 md:p-8">
      <div className="flex items-center gap-3 mb-6 md:mb-8">
        <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
          <LibraryIcon className="w-5 h-5 md:w-6 md:h-6 text-white" />
        </div>
        <h1 className="text-2xl md:text-3xl font-bold text-white">My Library</h1>
      </div>

      <Tabs defaultValue="all" className="w-full" onValueChange={setFilter}>
        <TabsList className="bg-[#111827] border border-white/10 mb-6 md:mb-8 flex flex-wrap h-auto p-1">
          <TabsTrigger value="all" className="data-[state=active]:bg-white/10 data-[state=active]:text-white flex-1 min-w-[70px] text-xs md:text-sm py-2">All</TabsTrigger>
          <TabsTrigger value="games" className="data-[state=active]:bg-white/10 data-[state=active]:text-white flex-1 min-w-[70px] text-xs md:text-sm py-2">Games</TabsTrigger>
          <TabsTrigger value="movies" className="data-[state=active]:bg-white/10 data-[state=active]:text-white flex-1 min-w-[70px] text-xs md:text-sm py-2">Movies</TabsTrigger>
          <TabsTrigger value="series" className="data-[state=active]:bg-white/10 data-[state=active]:text-white flex-1 min-w-[70px] text-xs md:text-sm py-2">Series</TabsTrigger>
        </TabsList>

        <div className="mt-0">
          {filteredItems.length === 0 ? (
            <div className="text-center py-10 md:py-20 text-gray-400 text-sm md:text-base">Your library is empty. Start adding some content!</div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
              {filteredItems.map(item => (
                <ContentCard 
                  key={item.id} 
                  item={{
                    external_id: item.media?.external_id || '',
                    media_type: item.media?.media_type || '',
                    title: item.media?.title || 'Unknown Title',
                    poster_url: item.media?.poster_url || '',
                    rating: item.rating || 0,
                    release_date: '',
                    genres: item.media?.genres || []
                  }} 
                  progress={progressMap[item.media_id]}
                />
              ))}
            </div>
          )}
        </div>
      </Tabs>
    </div>
  );
}
