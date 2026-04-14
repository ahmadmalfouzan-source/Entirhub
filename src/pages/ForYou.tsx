import { useEffect, useState } from 'react';
import { ContentCard } from '@/components/ContentCard';
import { Sparkles, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getRecommendations } from '@/services/recommendation';

export function ForYou() {
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRecommendations = async () => {
    setLoading(true);
    try {
      const data = await getRecommendations();
      // Map recommendation items to ContentCard expected format
      const mapped = data.map(item => ({
        external_id: item.external_id,
        media_type: item.media_type,
        title: item.title,
        poster_url: item.poster_url,
        rating: item.rating_global || 0,
        release_date: '',
        genres: []
      }));
      setRecommendations(mapped);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecommendations();
  }, []);

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3 mb-2">
            <Sparkles className="w-8 h-8 text-purple-400" />
            For You
          </h1>
          <p className="text-gray-400">Curated recommendations based on your library and preferences.</p>
        </div>
        <Button 
          onClick={fetchRecommendations} 
          disabled={loading}
          variant="outline" 
          className="bg-[#1f2937] border-white/10 text-white hover:bg-[#374151] hover:text-white"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="aspect-[2/3] bg-[#111827] rounded-xl animate-pulse border border-white/5"></div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
          {recommendations.map(item => (
            <div key={item.external_id} className="relative group">
              <ContentCard item={item} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
