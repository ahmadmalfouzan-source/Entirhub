import { useEffect, useState } from 'react';
import { GameCard, SectionHeader, Skeleton } from '@/components/premium';
import { Gamepad2, Film, Tv } from 'lucide-react';
import { fetchTrendingMovies, fetchTrendingSeries, fetchGames, MediaItem } from '@/services/api';
import { useNavigate } from 'react-router-dom';

export function ContentList({ type }: { type: 'game' | 'movie' | 'series' }) {
  const [content, setContent] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

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
    game: { title: 'Games', icon: Gamepad2, subtitle: 'INTERACTIVE TRANSMISSIONS' },
    movie: { title: 'Movies', icon: Film, subtitle: 'CINEMATIC DATA' },
    series: { title: 'TV Series', icon: Tv, subtitle: 'EPISODIC LOGS' }
  };

  const { title, icon: Icon, subtitle } = titles[type];

  return (
    <div className="flex flex-col min-h-screen bg-[#030308] pb-40 pt-24 px-6 animate-in fade-in duration-700">
      <div className="flex items-center gap-4 mb-12">
        <div className="w-14 h-14 rounded-[22px] bg-gradient-to-br from-primary to-accent p-0.5 shadow-2xl">
          <div className="w-full h-full rounded-[20px] bg-[#030308] flex items-center justify-center">
            <Icon className="w-6 h-6 text-primary" />
          </div>
        </div>
        <div>
          <h1 className="text-3xl font-black text-white italic tracking-tighter uppercase">{title}</h1>
          <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest leading-none mt-1">{subtitle}</p>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
          {[...Array(10)].map((_, i) => <Skeleton key={i} variant="card" className="h-[280px]" />)}
        </div>
      ) : content.length === 0 ? (
        <div className="text-center py-20 bg-white/[0.02] rounded-[48px] border border-dashed border-white/10">
          <p className="text-sm font-black text-gray-500 uppercase tracking-widest">No {title.toLowerCase()} found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
          {content.map(item => (
            <GameCard 
              key={item.external_id} 
              title={item.title} 
              poster={item.poster_url} 
              rating={item.rating}
              onClick={() => navigate(`/content/${item.external_id}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
