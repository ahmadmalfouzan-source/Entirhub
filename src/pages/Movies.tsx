import { useEffect, useState } from 'react';
import { ContentCard } from '@/components/ContentCard';
import { Film, Filter, Smile } from 'lucide-react';
import { fetchTrendingMovies, fetchPopularMovies, fetchMoviesByGenre, MediaItem } from '@/services/api';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/hooks/useTranslation';
import { useLanguageStore } from '@/store/useLanguageStore';

const MOVIE_GENRES = [
  { id: '28', nameKey: 'action' },
  { id: '35', nameKey: 'comedy' },
  { id: '18', nameKey: 'drama' },
  { id: '27', nameKey: 'horror' },
  { id: '878', nameKey: 'sciFi' },
  { id: '10749', nameKey: 'romance' },
  { id: '53', nameKey: 'thriller' },
  { id: '16', nameKey: 'animation' },
];

const MOODS = [
  { id: 'happy', nameKey: 'happy', genres: ['35', '16', '10751'] }, // Comedy, Animation, Family
  { id: 'sad', nameKey: 'sad', genres: ['18', '10749'] }, // Drama, Romance
  { id: 'excited', nameKey: 'excited', genres: ['28', '12', '878'] }, // Action, Adventure, Sci-Fi
  { id: 'scared', nameKey: 'scared', genres: ['27', '53'] }, // Horror, Thriller
  { id: 'relaxed', nameKey: 'relaxed', genres: ['99', '36', '10402'] }, // Documentary, History, Music
];

export default function Movies() {
  const { t } = useTranslation();
  const { language } = useLanguageStore();
  const [trending, setTrending] = useState<MediaItem[]>([]);
  const [popular, setPopular] = useState<MediaItem[]>([]);
  const [genreMovies, setGenreMovies] = useState<MediaItem[]>([]);
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);
      const lang = language === 'ar' ? 'ar' : 'en-US';
      const [trendingData, popularData] = await Promise.all([
        fetchTrendingMovies(lang),
        fetchPopularMovies(lang)
      ]);
      setTrending(trendingData);
      setPopular(popularData);
      setLoading(false);
    };
    loadInitialData();
  }, [language]);

  useEffect(() => {
    const loadGenreData = async () => {
      if (selectedGenre || selectedMood) {
        setLoading(true);
        let genresToFetch = selectedGenre;
        
        if (selectedMood) {
          const mood = MOODS.find(m => m.id === selectedMood);
          if (mood) {
            genresToFetch = mood.genres.join(',');
          }
        }

        const data = await fetchMoviesByGenre(genresToFetch || '', language === 'ar' ? 'ar-SA' : 'en-US');
        setGenreMovies(data);
        setLoading(false);
      }
    };
    loadGenreData();
  }, [selectedGenre, selectedMood, language]);

  const handleGenreSelect = (genreId: string | null) => {
    setSelectedGenre(genreId);
    setSelectedMood(null);
  };

  const handleMoodSelect = (moodId: string | null) => {
    setSelectedMood(moodId);
    setSelectedGenre(null);
  };

  return (
    <div className="p-4 md:p-8 space-y-8 md:space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-300 ease-in-out">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
            <Film className="w-5 h-5 md:w-6 md:h-6 text-white" />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">{t('movies')}</h1>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
        {/* Genre Filter */}
        <section>
          <div className="flex items-center gap-2 mb-4 md:mb-6">
            <Filter className="w-4 h-4 md:w-5 md:h-5 text-primary" />
            <h2 className="text-lg md:text-xl font-semibold text-foreground">{t('browseByGenre')}</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button 
              variant={selectedGenre === null && selectedMood === null ? "default" : "outline"}
              onClick={() => handleGenreSelect(null)}
              className="rounded-full text-xs md:text-sm h-8 md:h-10"
            >
              {t('all')}
            </Button>
            {MOVIE_GENRES.map(genre => (
              <Button 
                key={genre.id}
                variant={selectedGenre === genre.id ? "default" : "outline"}
                onClick={() => handleGenreSelect(genre.id)}
                className="rounded-full text-xs md:text-sm h-8 md:h-10"
              >
                {t(genre.nameKey as any)}
              </Button>
            ))}
          </div>
        </section>

        {/* Mood Filter */}
        <section>
          <div className="flex items-center gap-2 mb-4 md:mb-6">
            <Smile className="w-4 h-4 md:w-5 md:h-5 text-secondary" />
            <h2 className="text-lg md:text-xl font-semibold text-foreground">{t('whatsYourMood')}</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {MOODS.map(mood => (
              <Button 
                key={mood.id}
                variant={selectedMood === mood.id ? "secondary" : "outline"}
                onClick={() => handleMoodSelect(mood.id)}
                className="rounded-full text-xs md:text-sm h-8 md:h-10"
              >
                {t(mood.nameKey as any)}
              </Button>
            ))}
          </div>
        </section>
      </div>

      {selectedGenre || selectedMood ? (
        <section>
          <h2 className="text-xl md:text-2xl font-bold text-foreground mb-4 md:mb-6">
            {selectedGenre 
              ? `${t(MOVIE_GENRES.find(g => g.id === selectedGenre)?.nameKey as any)} ${t('movies')}`
              : `${t(MOODS.find(m => m.id === selectedMood)?.nameKey as any)} ${t('moodRecommendations')}`
            }
          </h2>
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
              {[...Array(10)].map((_, i) => (
                <div key={i} className="h-36 sm:h-auto sm:aspect-[2/3] bg-card rounded-xl animate-pulse border border-border"></div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
              {genreMovies.map(item => (
                <ContentCard key={item.external_id} item={item} />
              ))}
            </div>
          )}
        </section>
      ) : (
        <>
          <section>
            <h2 className="text-xl md:text-2xl font-bold text-foreground mb-4 md:mb-6">{t('trending')}</h2>
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-36 sm:h-auto sm:aspect-[2/3] bg-card rounded-xl animate-pulse border border-border"></div>
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
            <h2 className="text-xl md:text-2xl font-bold text-foreground mb-4 md:mb-6">{t('popularMovies')}</h2>
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-36 sm:h-auto sm:aspect-[2/3] bg-card rounded-xl animate-pulse border border-border"></div>
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
