import { useEffect, useState } from 'react';
import { ContentCard } from '@/components/ContentCard';
import { Sparkles, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getRecommendations } from '@/services/recommendation';
import { useTranslation } from '@/hooks/useTranslation';

export function ForYou() {
  const { t } = useTranslation();
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
        genres: [],
        reason: item.reason
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
    <div className="p-4 md:p-8 animate-in fade-in slide-in-from-bottom-4 duration-300 ease-in-out">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6 mb-6 md:mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-2 md:gap-3 mb-1 md:mb-2">
            <Sparkles className="w-6 h-6 md:w-8 md:h-8 text-purple-400" />
            {t('forYou')}
          </h1>
          <p className="text-gray-400 text-sm md:text-base">{t('forYouSubtitle')}</p>
        </div>
        <Button 
          onClick={fetchRecommendations} 
          disabled={loading}
          variant="outline" 
          className="bg-[#1f2937] border-white/10 text-white hover:bg-[#374151] hover:text-white w-full md:w-auto"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          {t('refresh')}
        </Button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-36 sm:h-auto sm:aspect-[2/3] bg-[#111827] rounded-xl animate-pulse border border-white/5"></div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
          {recommendations.map(item => (
            <div key={item.external_id} className="relative group flex flex-col">
              <ContentCard item={item} />
              {item.reason && (
                <div className="mt-2 text-xs text-blue-400 bg-blue-500/10 px-2 py-1 rounded-md self-start">
                  {item.reason}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
