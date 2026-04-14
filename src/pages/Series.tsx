import { useEffect, useState } from 'react';
import { ContentCard } from '@/components/ContentCard';
import { Tv, Filter } from 'lucide-react';
import { fetchTrendingSeries, fetchPopularSeries, fetchSeriesByGenre, MediaItem } from '@/services/api';
import { Button } from '@/components/ui/button';

const SERIES_GENRES = [
  { id: '10759', name: 'Action & Adventure' },
  { id: '16', name: 'Animation' },
  { id: '35', name: 'Comedy' },
  { id: '80', name: 'Crime' },
  { id: '18', name: 'Drama' },
  { id: '10765', name: 'Sci-Fi & Fantasy' },
  { id: '9648', name: 'Mystery' },
  { id: '10764', name: 'Reality' },
];

export default function Series() {
  const [trending, setTrending] = useState<MediaItem[]>([]);
  const [popular, setPopular] = useState<MediaItem[]>([]);
  const [genreSeries, setGenreSeries] = useState<MediaItem[]>([]);
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);
      const [trendingData, popularData] = await Promise.all([
        fetchTrendingSeries(),
        fetchPopularSeries()
      ]);
      setTrending(trendingData);
      setPopular(popularData);
      setLoading(false);
    };
    loadInitialData();
  }, []);

  useEffect(() => {
    const loadGenreData = async () => {
      if (selectedGenre) {
        setLoading(true);
        const data = await fetchSeriesByGenre(selectedGenre);
        setGenreSeries(data);
        setLoading(false);
      }
    };
    loadGenreData();
  }, [selectedGenre]);

  return (
    <div className="p-8 space-y-12">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
            <Tv className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white">Series</h1>
        </div>
      </div>

      {/* Genre Filter */}
      <section>
        <div className="flex items-center gap-2 mb-6">
          <Filter className="w-5 h-5 text-blue-400" />
          <h2 className="text-xl font-semibold text-white">Filter by Genre</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button 
            variant={selectedGenre === null ? "default" : "outline"}
            onClick={() => setSelectedGenre(null)}
            className={`rounded-full ${
              selectedGenre === null 
                ? "bg-blue-600 text-white" 
                : "bg-[#1f2937] text-white border-transparent hover:bg-[#374151]"
            }`}
          >
            All
          </Button>
          {SERIES_GENRES.map(genre => (
            <Button 
              key={genre.id}
              variant={selectedGenre === genre.id ? "default" : "outline"}
              onClick={() => setSelectedGenre(genre.id)}
              className={`rounded-full ${
                selectedGenre === genre.id 
                  ? "bg-blue-600 text-white" 
                  : "bg-[#1f2937] text-white border-transparent hover:bg-[#374151]"
              }`}
            >
              {genre.name}
            </Button>
          ))}
        </div>
      </section>

      {selectedGenre ? (
        <section>
          <h2 className="text-2xl font-bold text-white mb-6">
            {SERIES_GENRES.find(g => g.id === selectedGenre)?.name} Series
          </h2>
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
              {[...Array(10)].map((_, i) => (
                <div key={i} className="aspect-[2/3] bg-[#111827] rounded-xl animate-pulse border border-white/5"></div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
              {genreSeries.map(item => (
                <ContentCard key={item.external_id} item={item} />
              ))}
            </div>
          )}
        </section>
      ) : (
        <>
          <section>
            <h2 className="text-2xl font-bold text-white mb-6">Trending Series</h2>
            {loading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="aspect-[2/3] bg-[#111827] rounded-xl animate-pulse border border-white/5"></div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
                {trending.map(item => (
                  <ContentCard key={item.external_id} item={item} />
                ))}
              </div>
            )}
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-6">Popular Series</h2>
            {loading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="aspect-[2/3] bg-[#111827] rounded-xl animate-pulse border border-white/5"></div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
                {popular.map(item => (
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
