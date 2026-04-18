import { useEffect, useState } from 'react';
import { ContentCard } from '@/components/ContentCard';
import { Gamepad2, Film, Tv } from 'lucide-react';
import { fetchTrendingMovies, fetchTrendingSeries, fetchGames, MediaItem } from '@/services/api';

export function ContentList({ type }: { type: 'game' | 'movie' | 'series' }) {
  const [content, setContent] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        let data: MediaItem[] = [];
        if (type === 'movie') {
          data = await fetchTrendingMovies();
        } else if (type === 'series') {
          data = await fetchTrendingSeries();
        } else if (type === 'game') {
          data = await fetchGames();
        }
        setContent(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [type]);

  const titles = {
    game: { title: 'Games', icon: Gamepad2, color: 'text-accent' },
    movie: { title: 'Movies', icon: Film, color: 'text-purple-400' },
    series: { title: 'TV Series', icon: Tv, color: 'text-pink-400' }
  };

  const { title, icon: Icon } = titles[type];

  return (
    <div className="p-8">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
          <Icon className="w-6 h-6 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-white">{title}</h1>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="aspect-[2/3] bg-surface rounded-xl animate-pulse border border-white/5"></div>
          ))}
        </div>
      ) : content.length === 0 ? (
        <div className="text-center py-20 text-gray-400">No {title.toLowerCase()} found.</div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
          {content.map(item => (
            <ContentCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}
