import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, BookOpen } from 'lucide-react';
import { fetchMediaDetails, MediaItem } from '@/services/api';

export function GameWiki() {
  const { id } = useParams();
  const [game, setGame] = useState<MediaItem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchMediaDetails(id, 'game').then(data => {
        setGame(data);
        setLoading(false);
      });
    }
  }, [id]);

  if (loading) {
    return (
      <div className="p-8 flex flex-col items-center justify-center h-[60vh] space-y-4">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-gray-400">Loading Wiki...</p>
      </div>
    );
  }

  if (!game) return <div className="p-8 text-white">Wiki not available.</div>;

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Link to={`/content/${id}`} className="p-2 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors">
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white">{game.title} Wiki</h1>
          </div>
        </div>
      </div>

      <div className="bg-[#111827] rounded-xl p-8 border border-white/5">
        <h2 className="text-2xl font-bold text-white mb-4">Overview</h2>
        <div className="prose prose-invert max-w-none prose-p:text-gray-300 prose-headings:text-white prose-a:text-blue-400">
          <p>{game.description || 'No detailed information available for this game.'}</p>
        </div>
      </div>
    </div>
  );
}
