import { useEffect, useState } from 'react';
import { ContentCard } from '@/components/ContentCard';
import { Gamepad2, Search, Trophy, Bookmark, Play } from 'lucide-react';
import { fetchGames, fetchTopRatedGames, MediaItem } from '@/services/api';
import { Input } from '@/components/ui/input';
import { useStore } from '@/store/useStore';
import { Button } from '@/components/ui/button';

export default function Games() {
  const [topRated, setTopRated] = useState<MediaItem[]>([]);
  const [searchResults, setSearchResults] = useState<MediaItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const { watchlist, updateWatchlistItem } = useStore();

  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);
      const data = await fetchTopRatedGames();
      setTopRated(data);
      setLoading(false);
    };
    loadInitialData();
  }, []);

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchQuery.trim()) {
        setIsSearching(true);
        const data = await fetchGames(searchQuery);
        setSearchResults(data);
        setIsSearching(false);
      } else {
        setSearchResults([]);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const backlog = watchlist.filter(item => 
    item.media?.media_type === 'game' && item.status === 'planned'
  );

  const handleStartPlaying = (id: string) => {
    updateWatchlistItem(id, { status: 'watching' });
  };

  return (
    <div className="p-8 space-y-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
            <Gamepad2 className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">Games</h1>
        </div>

        <div className="relative max-w-md w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input 
            placeholder="Search games..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 bg-white/5 border-border text-foreground rounded-full h-12 focus-visible:ring-primary"
          />
        </div>
      </div>

      {searchQuery ? (
        <section>
          <h2 className="text-2xl font-bold text-foreground mb-6">Search Results</h2>
          {isSearching ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
              {[...Array(10)].map((_, i) => (
                <div key={i} className="aspect-[2/3] bg-card rounded-xl animate-pulse border border-border"></div>
              ))}
            </div>
          ) : searchResults.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
              {searchResults.map(item => (
                <ContentCard key={item.external_id} item={item} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20 text-muted-foreground">No games found for "{searchQuery}"</div>
          )}
        </section>
      ) : (
        <>
          {backlog.length > 0 && (
            <section className="bg-primary/5 border border-primary/10 rounded-3xl p-8">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <Bookmark className="w-6 h-6 text-primary" />
                  <h2 className="text-2xl font-bold text-foreground">My Backlog</h2>
                  <span className="bg-primary/20 text-primary px-2 py-0.5 rounded text-sm ml-2">{backlog.length}</span>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
                {backlog.map(item => (
                  <div key={item.id} className="relative group">
                    <ContentCard 
                      item={{
                        external_id: item.media.external_id || '',
                        media_type: 'game',
                        title: item.media.title,
                        poster_url: item.media.poster_url,
                        rating: item.rating || 0,
                        release_date: item.media.release_date || '',
                        genres: []
                      }} 
                    />
                    <div className="absolute inset-x-0 bottom-0 p-4 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all">
                      <Button 
                        onClick={() => handleStartPlaying(item.id)}
                        className="w-full bg-primary hover:bg-primary/90 text-white shadow-lg"
                        size="sm"
                      >
                        <Play className="w-3 h-3 mr-2 fill-current" />
                        Start Playing
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          <section>
            <div className="flex items-center gap-2 mb-6">
              <Trophy className="w-6 h-6 text-yellow-500" />
              <h2 className="text-2xl font-bold text-foreground">Top Rated Games</h2>
            </div>
            {loading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
                {[...Array(10)].map((_, i) => (
                  <div key={i} className="aspect-[2/3] bg-card rounded-xl animate-pulse border border-border"></div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
                {topRated.map(item => (
                  <ContentCard key={item.external_id} item={item} />
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
