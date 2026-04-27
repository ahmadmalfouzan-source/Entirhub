import { useEffect, useState } from 'react';
import { 
  GameCard, 
  SectionHeader, 
  PremiumButton,
  Skeleton 
} from '@/components/premium';
import { Film, Filter, Smile } from 'lucide-react';
import { fetchTrendingMovies, fetchPopularMovies, fetchMoviesByGenre, MediaItem } from '@/services/api';
import { useTranslation } from '@/hooks/useTranslation';
import { useLanguageStore } from '@/store/useLanguageStore';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';

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
  { id: 'happy', nameKey: 'happy', genres: ['35', '16', '10751'] },
  { id: 'sad', nameKey: 'sad', genres: ['18', '10749'] },
  { id: 'excited', nameKey: 'excited', genres: ['28', '12', '878'] },
  { id: 'scared', nameKey: 'scared', genres: ['27', '53'] },
  { id: 'relaxed', nameKey: 'relaxed', genres: ['99', '36', '10402'] },
];

export default function Movies() {
  const { t } = useTranslation();
  const { language } = useLanguageStore();
  const navigate = useNavigate();
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
    <div className="flex flex-col min-h-screen bg-[#030308] pb-40 animate-in fade-in duration-700">
      {/* Immersive Hero Header */}
      <div className="pt-24 px-6 space-y-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-[22px] bg-gradient-to-br from-primary to-accent p-0.5 shadow-2xl">
              <div className="w-full h-full rounded-[20px] bg-[#030308] flex items-center justify-center">
                <Film className="w-6 h-6 text-primary" />
              </div>
            </div>
            <div>
              <h1 className="text-3xl font-black text-white italic tracking-tighter uppercase">{t('movies')}</h1>
              <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest leading-none mt-1">CINEMATIC COLLECTIONS</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Genre Selection */}
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-primary" />
              <h2 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">{t('browseByGenre')}</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              <button 
                onClick={() => handleGenreSelect(null)}
                className={cn(
                  "px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all active:scale-95",
                  selectedGenre === null && selectedMood === null
                    ? "bg-primary border-primary text-white shadow-lg"
                    : "bg-white/5 border-white/5 text-gray-500 hover:text-white"
                )}
              >
                {t('all')}
              </button>
              {MOVIE_GENRES.map(genre => (
                <button 
                  key={genre.id}
                  onClick={() => handleGenreSelect(genre.id)}
                  className={cn(
                    "px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all active:scale-95",
                    selectedGenre === genre.id
                      ? "bg-primary border-primary text-white shadow-lg"
                      : "bg-white/5 border-white/5 text-gray-500 hover:text-white"
                  )}
                >
                  {t(genre.nameKey as any)}
                </button>
              ))}
            </div>
          </section>

          {/* Mood Selection */}
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <Smile className="w-4 h-4 text-accent" />
              <h2 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">{t('whatsYourMood')}</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {MOODS.map(mood => (
                <button 
                  key={mood.id}
                  onClick={() => handleMoodSelect(mood.id)}
                  className={cn(
                    "px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all active:scale-95",
                    selectedMood === mood.id
                      ? "bg-accent border-accent text-white shadow-lg"
                      : "bg-white/5 border-white/5 text-gray-500 hover:text-white"
                  )}
                >
                  {t(mood.nameKey as any)}
                </button>
              ))}
            </div>
          </section>
        </div>
      </div>

      <div className="px-6 py-12 space-y-16">
        <AnimatePresence mode="wait">
          {selectedGenre || selectedMood ? (
            <motion.section 
              key="filtered"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              <SectionHeader 
                title={selectedGenre 
                  ? t(MOVIE_GENRES.find(g => g.id === selectedGenre)?.nameKey as any)
                  : t(MOODS.find(m => m.id === selectedMood)?.nameKey as any)
                }
                subtitle={selectedGenre ? t('movies').toUpperCase() : "MOOD MATCHED"} 
              />
              {loading ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
                   {[...Array(10)].map((_, i) => <Skeleton key={i} variant="card" className="h-[280px]" />)}
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
                  {genreMovies.map(item => (
                    <GameCard 
                      key={item.external_id} 
                      title={item.title} 
                      poster={item.poster_url} 
                      rating={item.rating}
                      onClick={() => navigate(`/content/movie_${item.external_id}`)}
                    />
                  ))}
                </div>
              )}
            </motion.section>
          ) : (
            <div className="space-y-16">
              <section className="space-y-8">
                <SectionHeader title={t('trending')} subtitle="SITUATION REPORT" />
                {loading ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
                    {[...Array(5)].map((_, i) => <Skeleton key={i} variant="card" className="h-[280px]" />)}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
                    {trending.map(item => (
                      <GameCard 
                        key={item.external_id} 
                        title={item.title} 
                        poster={item.poster_url} 
                        rating={item.rating}
                        onClick={() => navigate(`/content/movie_${item.external_id}`)}
                      />
                    ))}
                  </div>
                )}
              </section>

              <section className="space-y-8">
                <SectionHeader title={t('popularMovies')} subtitle="COMMUNITY FAVORITES" />
                {loading ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
                    {[...Array(5)].map((_, i) => <Skeleton key={i} variant="card" className="h-[280px]" />)}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
                    {popular.map(item => (
                      <GameCard 
                        key={item.external_id} 
                        title={item.title} 
                        poster={item.poster_url} 
                        rating={item.rating}
                        onClick={() => navigate(`/content/movie_${item.external_id}`)}
                      />
                    ))}
                  </div>
                )}
              </section>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
