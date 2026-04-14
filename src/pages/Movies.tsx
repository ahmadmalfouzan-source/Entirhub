import { useEffect, useState } from 'react';
import { ContentCard } from '@/components/ContentCard';
import { Film, Filter, Smile } from 'lucide-react';
import { fetchTrendingMovies, fetchPopularMovies, fetchMoviesByGenre, MediaItem } from '@/services/api';
import { Button } from '@/components/ui/button';

const MOVIE_GENRES = [
  { id: '28', name: 'Action' },
  { id: '35', name: 'Comedy' },
  { id: '18', name: 'Drama' },
  { id: '27', name: 'Horror' },
  { id: '878', name: 'Sci-Fi' },
  { id: '10749', name: 'Romance' },
  { id: '53', name: 'Thriller' },
  { id: '16', name: 'Animation' },
];

const MOODS = [
  { id: 'happy', name: 'Happy', genres: ['35', '16', '10751'] }, // Comedy, Animation, Family
  { id: 'sad', name: 'Sad', genres: ['18', '10749'] }, // Drama, Romance
  { id: 'excited', name: 'Excited', genres: ['28', '12', '878'] }, // Action, Adventure, Sci-Fi
  { id: 'scared', name: 'Scared', genres: ['27', '53'] }, // Horror, Thriller
  { id: 'relaxed', name: 'Relaxed', genres: ['99', '36', '10402'] }, // Documentary, History, Music
];

export default function Movies() {
  const [trending, setTrending] = useState<MediaItem[]>([]);
  const [popular, setPopular] = useState<MediaItem[]>([]);
  const [genreMovies, setGenreMovies] = useState<MediaItem[]>([]);
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);
      const [trendingData, popularData] = await Promise.all([
        fetchTrendingMovies(),
        fetchPopularMovies()
      ]);
      setTrending(trendingData);
      setPopular(popularData);
      setLoading(false);
    };
    loadInitialData();
  }, []);

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

        const data = await fetchMoviesByGenre(genresToFetch || '');
        setGenreMovies(data);
        setLoading(false);
      }
    };
    loadGenreData();
  }, [selectedGenre, selectedMood]);

  const handleGenreSelect = (genreId: string | null) => {
    setSelectedGenre(genreId);
    setSelectedMood(null);
  };

  const handleMoodSelect = (moodId: string | null) => {
    setSelectedMood(moodId);
    setSelectedGenre(null);
  };

  return (
    <div className="p-8 space-y-12">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
            <Film className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">Movies</h1>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Genre Filter */}
        <section>
          <div className="flex items-center gap-2 mb-6">
            <Filter className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-semibold text-foreground">Filter by Genre</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button 
              variant={selectedGenre === null && selectedMood === null ? "default" : "outline"}
              onClick={() => handleGenreSelect(null)}
              className="rounded-full"
            >
              All
            </Button>
            {MOVIE_GENRES.map(genre => (
              <Button 
                key={genre.id}
                variant={selectedGenre === genre.id ? "default" : "outline"}
                onClick={() => handleGenreSelect(genre.id)}
                className="rounded-full"
              >
                {genre.name}
              </Button>
            ))}
          </div>
        </section>

        {/* Mood Filter */}
        <section>
          <div className="flex items-center gap-2 mb-6">
            <Smile className="w-5 h-5 text-secondary" />
            <h2 className="text-xl font-semibold text-foreground">What's your mood?</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {MOODS.map(mood => (
              <Button 
                key={mood.id}
                variant={selectedMood === mood.id ? "secondary" : "outline"}
                onClick={() => handleMoodSelect(mood.id)}
                className="rounded-full"
              >
                {mood.name}
              </Button>
            ))}
          </div>
        </section>
      </div>

      {selectedGenre || selectedMood ? (
        <section>
          <h2 className="text-2xl font-bold text-foreground mb-6">
            {selectedGenre 
              ? `${MOVIE_GENRES.find(g => g.id === selectedGenre)?.name} Movies`
              : `${MOODS.find(m => m.id === selectedMood)?.name} Mood Recommendations`
            }
          </h2>
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
              {[...Array(10)].map((_, i) => (
                <div key={i} className="aspect-[2/3] bg-card rounded-xl animate-pulse border border-border"></div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
              {genreMovies.map(item => (
                <ContentCard key={item.external_id} item={item} />
              ))}
            </div>
          )}
        </section>
      ) : (
        <>
          <section>
            <h2 className="text-2xl font-bold text-foreground mb-6">Trending Movies</h2>
            {loading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="aspect-[2/3] bg-card rounded-xl animate-pulse border border-border"></div>
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
            <h2 className="text-2xl font-bold text-foreground mb-6">Popular Movies</h2>
            {loading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="aspect-[2/3] bg-card rounded-xl animate-pulse border border-border"></div>
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
