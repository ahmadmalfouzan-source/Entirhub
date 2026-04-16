import { useEffect, useState } from 'react';
import { ContentCard } from '@/components/ContentCard';
import { Tv, Filter } from 'lucide-react';
import { fetchTrendingSeries, fetchPopularSeries, fetchSeriesByGenre, MediaItem } from '@/services/api';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/hooks/useTranslation';
import { useLanguageStore } from '@/store/useLanguageStore';

const SERIES_GENRES = [
  { id: '10759', nameKey: 'actionAdventure' },
  { id: '16', nameKey: 'animation' },
  { id: '35', nameKey: 'comedy' },
  { id: '80', nameKey: 'crime' },
  { id: '18', nameKey: 'drama' },
  { id: '10765', nameKey: 'sciFiFantasy' },
  { id: '9648', nameKey: 'mystery' },
  { id: '10764', nameKey: 'reality' },
];

export default function Series() {
  const { t } = useTranslation();
  const { language } = useLanguageStore();
  const [trending, setTrending] = useState<MediaItem[]>([]);
  const [popular, setPopular] = useState<MediaItem[]>([]);
  const [genreSeries, setGenreSeries] = useState<MediaItem[]>([]);
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);
      const lang = language === 'ar' ? 'ar' : 'en-US';
      const [trendingData, popularData] = await Promise.all([
        fetchTrendingSeries(lang),
        fetchPopularSeries(lang)
      ]);
      setTrending(trendingData);
      setPopular(popularData);
      setLoading(false);
    };
    loadInitialData();
  }, [language]);

  useEffect(() => {
    const loadGenreData = async () => {
      if (selectedGenre) {
        setLoading(true);
        const data = await fetchSeriesByGenre(selectedGenre, language === 'ar' ? 'ar-SA' : 'en-US');
        setGenreSeries(data);
        setLoading(false);
      }
    };
    loadGenreData();
  }, [selectedGenre, language]);

  return (
    <div className="p-4 md:p-8 space-y-8 md:space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-300 ease-in-out">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
            <Tv className="w-5 h-5 md:w-6 md:h-6 text-white" />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-white">{t('series')}</h1>
        </div>
      </div>

      {/* Genre Filter */}
      <section>
        <div className="flex items-center gap-2 mb-4 md:mb-6">
          <Filter className="w-4 h-4 md:w-5 md:h-5 text-blue-400" />
          <h2 className="text-lg md:text-xl font-semibold text-white">{t('browseByGenre')}</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button 
            variant={selectedGenre === null ? "default" : "outline"}
            onClick={() => setSelectedGenre(null)}
            className={`rounded-full text-xs md:text-sm h-8 md:h-10 ${
              selectedGenre === null 
                ? "bg-blue-600 text-white" 
                : "bg-[#1f2937] text-white border-transparent hover:bg-[#374151]"
            }`}
          >
            {t('all')}
          </Button>
          {SERIES_GENRES.map(genre => (
            <Button 
              key={genre.id}
              variant={selectedGenre === genre.id ? "default" : "outline"}
              onClick={() => setSelectedGenre(genre.id)}
              className={`rounded-full text-xs md:text-sm h-8 md:h-10 ${
                selectedGenre === genre.id 
                  ? "bg-blue-600 text-white" 
                  : "bg-[#1f2937] text-white border-transparent hover:bg-[#374151]"
              }`}
            >
              {t(genre.nameKey as any)}
            </Button>
          ))}
        </div>
      </section>

      {selectedGenre ? (
        <section>
          <h2 className="text-xl md:text-2xl font-bold text-white mb-4 md:mb-6">
            {t(SERIES_GENRES.find(g => g.id === selectedGenre)?.nameKey as any)} {t('series')}
          </h2>
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
              {[...Array(10)].map((_, i) => (
                <div key={i} className="h-36 sm:h-auto sm:aspect-[2/3] bg-[#111827] rounded-xl animate-pulse border border-white/5"></div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
              {genreSeries.map(item => (
                <ContentCard key={item.external_id} item={item} />
              ))}
            </div>
          )}
        </section>
      ) : (
        <>
          <section>
            <h2 className="text-xl md:text-2xl font-bold text-white mb-4 md:mb-6">{t('trending')}</h2>
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-36 sm:h-auto sm:aspect-[2/3] bg-[#111827] rounded-xl animate-pulse border border-white/5"></div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
                {trending.map(item => (
                  <ContentCard key={item.external_id} item={item} />
                ))}
              </div>
            )}
          </section>

          <section>
            <h2 className="text-xl md:text-2xl font-bold text-white mb-4 md:mb-6">{t('popularSeries')}</h2>
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-36 sm:h-auto sm:aspect-[2/3] bg-[#111827] rounded-xl animate-pulse border border-white/5"></div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
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
