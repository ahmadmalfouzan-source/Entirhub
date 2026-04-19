import { getCacheOrFetch } from './cacheService';

export const TMDB_API_KEY = import.meta.env.VITE_TMDB_API_KEY || '';
const RAWG_API_KEY = import.meta.env.VITE_RAWG_API_KEY || '';

export const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const RAWG_BASE_URL = 'https://api.rawg.io/api';

export interface MediaItem {
  external_id: string;
  media_type: 'movie' | 'series' | 'game';
  title: string;
  poster_url: string;
  backdrop_url?: string;
  rating: number;
  release_date: string;
  genres: string[];
  description?: string;
  number_of_episodes?: number;
  status?: string;
  next_episode_to_air?: any;
  last_episode_to_air?: any;
  credits?: { cast: any[] };
  metacritic?: number;
}

const getTmdbImageUrl = (path: string | null, type: 'poster' | 'backdrop' = 'poster') => {
  if (!path) return type === 'poster' 
    ? 'https://images.unsplash.com/photo-1616530940355-351fabd9524b?w=342&q=80'
    : 'https://images.unsplash.com/photo-1626814026160-2237a95fc5a0?w=1280&q=80';
  
  const size = type === 'poster' ? 'w342' : 'original';
  return `https://image.tmdb.org/t/p/${size}${path}`;
};

export const fetchTrendingMovies = async (lang = 'en-US'): Promise<MediaItem[]> => {
  if (!TMDB_API_KEY) return [];
  const cacheKey = `trending_movies_${lang}`;
  
  return getCacheOrFetch(cacheKey, async () => {
    const res = await fetch(`${TMDB_BASE_URL}/trending/movie/week?api_key=${TMDB_API_KEY}&language=${lang}`).catch(() => null);
    if (!res || !res.ok) throw new Error('Failed to fetch trending movies');
    const data = await res.json();
    return data.results.map((item: any) => ({
      external_id: `tmdb_movie_${item.id}`,
      media_type: 'movie',
      title: item.title,
      poster_url: getTmdbImageUrl(item.poster_path),
      backdrop_url: getTmdbImageUrl(item.backdrop_path, 'backdrop'),
      rating: item.vote_average,
      release_date: item.release_date,
      genres: ['Movie'],
      description: item.overview,
    }));
  }, { expiresInHours: 1, fallbackOnError: true }).catch(() => []);
};

export const fetchTrendingSeries = async (lang = 'en-US'): Promise<MediaItem[]> => {
  if (!TMDB_API_KEY) return [];
  const cacheKey = `trending_series_${lang}`;
  
  return getCacheOrFetch(cacheKey, async () => {
    const res = await fetch(`${TMDB_BASE_URL}/trending/tv/week?api_key=${TMDB_API_KEY}&language=${lang}`).catch(() => null);
    if (!res || !res.ok) throw new Error('Failed to fetch trending series');
    const data = await res.json();
    return data.results.map((item: any) => ({
      external_id: `tmdb_series_${item.id}`,
      media_type: 'series',
      title: item.name,
      poster_url: getTmdbImageUrl(item.poster_path),
      backdrop_url: getTmdbImageUrl(item.backdrop_path, 'backdrop'),
      rating: item.vote_average,
      release_date: item.first_air_date,
      genres: ['Series'],
      description: item.overview,
    }));
  }, { expiresInHours: 1, fallbackOnError: true }).catch(() => []);
};

export const searchMedia = async (query: string): Promise<MediaItem[]> => {
  if (!TMDB_API_KEY || !query) return [];
  const cacheKey = `search_multi_${query.toLowerCase().trim()}`;
  
  return getCacheOrFetch(cacheKey, async () => {
    const res = await fetch(`${TMDB_BASE_URL}/search/multi?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}`).catch(() => null);
    if (!res || !res.ok) throw new Error('Search failed');
    const data = await res.json();
    return data.results
      .filter((item: any) => item.media_type === 'movie' || item.media_type === 'tv')
      .map((item: any) => ({
        external_id: `tmdb_${item.media_type === 'tv' ? 'series' : 'movie'}_${item.id}`,
        media_type: item.media_type === 'tv' ? 'series' : 'movie',
        title: item.title || item.name,
        poster_url: getTmdbImageUrl(item.poster_path),
        backdrop_url: getTmdbImageUrl(item.backdrop_path, 'backdrop'),
        rating: item.vote_average,
        release_date: item.release_date || item.first_air_date,
        genres: [item.media_type === 'tv' ? 'Series' : 'Movie'],
        description: item.overview,
        status: item.status,
        next_episode_to_air: item.next_episode_to_air,
      }));
  }, { expiresInHours: 0.5, fallbackOnError: true }).catch(() => []);
};

export const searchAnime = async (query: string): Promise<MediaItem[]> => {
  if (!query) return [];
  const cacheKey = `search_anime_${query.toLowerCase().trim()}`;
  
  return getCacheOrFetch(cacheKey, async () => {
    const res = await fetch(`https://api.jikan.moe/v4/anime?q=${encodeURIComponent(query)}&limit=3`).catch(() => null);
    if (!res || !res.ok) throw new Error('Anime search failed');
    const data = await res.json();
    return data.data.map((item: any) => ({
      external_id: `jikan_${item.mal_id}`,
      media_type: 'series',
      title: item.title_english || item.title,
      poster_url: item.images.jpg.large_image_url,
      rating: (item.score || 0) * 2,
      release_date: item.aired?.from || '',
      genres: ['Anime'],
      description: item.synopsis,
    }));
  }, { expiresInHours: 0.5, fallbackOnError: true }).catch(() => []);
};

export const fetchGames = async (search?: string): Promise<MediaItem[]> => {
  if (!RAWG_API_KEY) return [];
  const cacheKey = `fetch_games_${search ? search.toLowerCase().trim() : 'top_rated'}`;
  
  return getCacheOrFetch(cacheKey, async () => {
    const url = search 
      ? `${RAWG_BASE_URL}/games?key=${RAWG_API_KEY}&search=${encodeURIComponent(search)}`
      : `${RAWG_BASE_URL}/games?key=${RAWG_API_KEY}&ordering=-rating`;
    const res = await fetch(url).catch(() => null);
    if (!res || !res.ok) throw new Error('Games fetch failed');
    const data = await res.json();
    return data.results.map((item: any) => ({
      external_id: `rawg_game_${item.id}`,
      media_type: 'game',
      title: item.name,
      poster_url: item.background_image || 'https://images.unsplash.com/photo-1616530940355-351fabd9524b?w=500&q=80',
      backdrop_url: item.background_image,
      rating: item.rating,
      release_date: item.released,
      genres: item.genres?.map((g: any) => g.name) || [],
      description: '',
    }));
  }, { expiresInHours: search ? 0.5 : 1, fallbackOnError: true }).catch(() => []);
};

export const fetchMediaVideos = async (mediaType: 'movie' | 'series', externalId: string): Promise<any[]> => {
  if (!TMDB_API_KEY) return [];
  const cacheKey = `videos_${mediaType}_${externalId}`;
  
  return getCacheOrFetch(cacheKey, async () => {
    const tmdbId = externalId.replace('tmdb_series_', '').replace('tmdb_movie_', '').replace('tmdb_', '');
    const type = mediaType === 'series' ? 'tv' : 'movie';
    const res = await fetch(`${TMDB_BASE_URL}/${type}/${tmdbId}/videos?api_key=${TMDB_API_KEY}`).catch(() => null);
    if (!res || !res.ok) throw new Error('Videos fetch failed');
    const data = await res.json();
    return data.results || [];
  }, { expiresInHours: 0, fallbackOnError: true }).catch(() => []);
};

export const fetchSimilar = async (type: 'movie' | 'series', externalId: string): Promise<MediaItem[]> => {
  if (!TMDB_API_KEY) return [];
  const cacheKey = `similar_${type}_${externalId}`;
  
  return getCacheOrFetch(cacheKey, async () => {
    const tmdbId = externalId.replace('tmdb_series_', '').replace('tmdb_movie_', '').replace('tmdb_', '');
    const endpoint = type === 'series' ? 'tv' : 'movie';
    const res = await fetch(`${TMDB_BASE_URL}/${endpoint}/${tmdbId}/similar?api_key=${TMDB_API_KEY}`).catch(() => null);
    if (!res || !res.ok) throw new Error('Similar fetch failed');
    const data = await res.json();
    return data.results.map((item: any) => ({
      external_id: `tmdb_${type === 'series' ? 'series' : 'movie'}_${item.id}`,
      media_type: type,
      title: item.title || item.name,
      poster_url: item.poster_path ? `https://image.tmdb.org/t/p/w342${item.poster_path}` : 'https://images.unsplash.com/photo-1616530940355-351fabd9524b?w=342&q=80',
      backdrop_url: item.backdrop_path ? `https://image.tmdb.org/t/p/original${item.backdrop_path}` : undefined,
      rating: item.vote_average,
      release_date: item.release_date || item.first_air_date,
      genres: [],
      description: item.overview,
    }));
  }, { expiresInHours: 72, fallbackOnError: true }).catch(() => []);
};

export const fetchWatchProviders = async (type: 'movie' | 'series', externalId: string): Promise<any> => {
  if (!TMDB_API_KEY) return null;
  const cacheKey = `providers_${type}_${externalId}`;
  
  return getCacheOrFetch(cacheKey, async () => {
    const tmdbId = externalId.replace('tmdb_series_', '').replace('tmdb_movie_', '').replace('tmdb_', '');
    const endpoint = type === 'series' ? 'tv' : 'movie';
    const res = await fetch(`${TMDB_BASE_URL}/${endpoint}/${tmdbId}/watch/providers?api_key=${TMDB_API_KEY}`).catch(() => null);
    if (!res || !res.ok) throw new Error('Watch providers fetch failed');
    const data = await res.json();
    return data.results || null;
  }, { expiresInHours: 12, fallbackOnError: true }).catch(() => null);
};

export const fetchPopularMovies = async (lang = 'en-US'): Promise<MediaItem[]> => {
  if (!TMDB_API_KEY) return [];
  const cacheKey = `popular_movies_${lang}`;
  
  return getCacheOrFetch(cacheKey, async () => {
    const res = await fetch(`${TMDB_BASE_URL}/movie/popular?api_key=${TMDB_API_KEY}&language=${lang}`).catch(() => null);
    if (!res || !res.ok) throw new Error('Failed to fetch popular movies');
    const data = await res.json();
    return data.results.map((item: any) => ({
      external_id: `tmdb_movie_${item.id}`,
      media_type: 'movie',
      title: item.title,
      poster_url: getTmdbImageUrl(item.poster_path),
      backdrop_url: getTmdbImageUrl(item.backdrop_path, 'backdrop'),
      rating: item.vote_average,
      release_date: item.release_date,
      genres: ['Movie'],
      description: item.overview,
    }));
  }, { expiresInHours: 1, fallbackOnError: true }).catch(() => []);
};

export const fetchMoviesByGenre = async (genreId: string, lang = 'en-US'): Promise<MediaItem[]> => {
  if (!TMDB_API_KEY) return [];
  const cacheKey = `movies_genre_${genreId}_${lang}`;
  
  return getCacheOrFetch(cacheKey, async () => {
    const res = await fetch(`${TMDB_BASE_URL}/discover/movie?api_key=${TMDB_API_KEY}&with_genres=${genreId}&language=${lang}`).catch(() => null);
    if (!res || !res.ok) throw new Error('Failed to fetch movies by genre');
    const data = await res.json();
    return data.results.map((item: any) => ({
      external_id: `tmdb_movie_${item.id}`,
      media_type: 'movie',
      title: item.title,
      poster_url: getTmdbImageUrl(item.poster_path),
      backdrop_url: getTmdbImageUrl(item.backdrop_path, 'backdrop'),
      rating: item.vote_average,
      release_date: item.release_date,
      genres: ['Movie'],
      description: item.overview,
    }));
  }, { expiresInHours: 48, fallbackOnError: true }).catch(() => []);
};

export const fetchPopularSeries = async (lang = 'en-US'): Promise<MediaItem[]> => {
  if (!TMDB_API_KEY) return [];
  const cacheKey = `popular_series_${lang}`;
  
  return getCacheOrFetch(cacheKey, async () => {
    const res = await fetch(`${TMDB_BASE_URL}/tv/popular?api_key=${TMDB_API_KEY}&language=${lang}`).catch(() => null);
    if (!res || !res.ok) throw new Error('Failed to fetch popular series');
    const data = await res.json();
    return data.results.map((item: any) => ({
      external_id: `tmdb_series_${item.id}`,
      media_type: 'series',
      title: item.name,
      poster_url: getTmdbImageUrl(item.poster_path),
      backdrop_url: getTmdbImageUrl(item.backdrop_path, 'backdrop'),
      rating: item.vote_average,
      release_date: item.first_air_date,
      genres: ['Series'],
      description: item.overview,
    }));
  }, { expiresInHours: 1, fallbackOnError: true }).catch(() => []);
};

export const fetchSeriesByGenre = async (genreId: string, lang = 'en-US'): Promise<MediaItem[]> => {
  if (!TMDB_API_KEY) return [];
  const cacheKey = `series_genre_${genreId}_${lang}`;
  
  return getCacheOrFetch(cacheKey, async () => {
    const res = await fetch(`${TMDB_BASE_URL}/discover/tv?api_key=${TMDB_API_KEY}&with_genres=${genreId}&language=${lang}`).catch(() => null);
    if (!res || !res.ok) throw new Error('Failed to fetch series by genre');
    const data = await res.json();
    return data.results.map((item: any) => ({
      external_id: `tmdb_series_${item.id}`,
      media_type: 'series',
      title: item.name,
      poster_url: getTmdbImageUrl(item.poster_path),
      backdrop_url: getTmdbImageUrl(item.backdrop_path, 'backdrop'),
      rating: item.vote_average,
      release_date: item.first_air_date,
      genres: ['Series'],
      description: item.overview,
    }));
  }, { expiresInHours: 48, fallbackOnError: true }).catch(() => []);
};

export const fetchTopRatedGames = async (): Promise<MediaItem[]> => {
  if (!RAWG_API_KEY) return [];
  const cacheKey = `top_rated_games`;
  
  return getCacheOrFetch(cacheKey, async () => {
    const res = await fetch(`${RAWG_BASE_URL}/games?key=${RAWG_API_KEY}&ordering=-metacritic&page_size=20`).catch(() => null);
    if (!res || !res.ok) throw new Error('Failed to fetch top rated games');
    const data = await res.json();
    return data.results.map((item: any) => ({
      external_id: `rawg_game_${item.id}`,
      media_type: 'game',
      title: item.name,
      poster_url: item.background_image || 'https://images.unsplash.com/photo-1616530940355-351fabd9524b?w=500&q=80',
      backdrop_url: item.background_image,
      rating: item.rating,
      release_date: item.released,
      genres: item.genres?.map((g: any) => g.name) || [],
      description: '',
    }));
  }, { expiresInHours: 1, fallbackOnError: true }).catch(() => []);
};

export const fetchMediaDetails = async (id: string, type: 'movie' | 'series' | 'game', lang = 'en-US'): Promise<MediaItem | null> => {
  const cacheKey = `details_${id}_${type}_${lang}`;
  
  return getCacheOrFetch(cacheKey, async () => {
    if (type === 'game' && RAWG_API_KEY) {
      const rawgId = id.replace('rawg_game_', '').replace('rawg_', '');
      const res = await fetch(`${RAWG_BASE_URL}/games/${rawgId}?key=${RAWG_API_KEY}`).catch(() => null);
      if (!res || !res.ok) throw new Error('Game details fetch failed');
      const item = await res.json();
      const result: MediaItem = {
        external_id: `rawg_game_${item.id}`,
        media_type: 'game',
        title: item.name,
        poster_url: item.background_image || 'https://images.unsplash.com/photo-1616530940355-351fabd9524b?w=500&q=80',
        backdrop_url: item.background_image_additional || item.background_image,
        rating: item.rating,
        metacritic: item.metacritic,
        release_date: item.released,
        genres: item.genres?.map((g: any) => g.name) || [],
        description: item.description_raw || item.description,
      };
      return result;
    } else if (TMDB_API_KEY) {
      const tmdbId = id.replace('tmdb_movie_', '').replace('tmdb_series_', '').replace('tmdb_', '');
      const endpoint = type === 'movie' ? 'movie' : 'tv';
      const url = `${TMDB_BASE_URL}/${endpoint}/${tmdbId}?api_key=${TMDB_API_KEY}&append_to_response=videos,credits,similar&language=${lang}`;
      
      const res = await fetch(url).catch((err) => {
        console.error('[API Debug] Fetch failed:', err);
        return null;
      });
      
      if (!res || !res.ok) {
        throw new Error(`TMDB response not OK: ${res?.status}`);
      }
      
      const item = await res.json();
      const result: MediaItem = {
        external_id: `tmdb_${type === 'series' ? 'series' : 'movie'}_${item.id}`,
        media_type: type as 'movie' | 'series',
        title: item.title || item.name,
        poster_url: getTmdbImageUrl(item.poster_path),
        backdrop_url: getTmdbImageUrl(item.backdrop_path, 'backdrop'),
        rating: item.vote_average,
        release_date: item.release_date || item.first_air_date,
        genres: item.genres?.map((g: any) => g.name) || [],
        description: item.overview,
        number_of_episodes: item.number_of_episodes,
        status: item.status,
        next_episode_to_air: item.next_episode_to_air,
        last_episode_to_air: item.last_episode_to_air,
        credits: item.credits,
      };
      return result;
    }
    return null;
  }, { expiresInHours: 168, fallbackOnError: true }).catch(() => null);
};

export const fetchCalendarReleases = async (startDate: string, endDate: string) => {
  const cacheKey = `calendar_${startDate}_${endDate}`;
  
  return getCacheOrFetch(cacheKey, async () => {
    const moviePromise = TMDB_API_KEY 
      ? fetch(`${TMDB_BASE_URL}/discover/movie?api_key=${TMDB_API_KEY}&primary_release_date.gte=${startDate}&primary_release_date.lte=${endDate}&sort_by=popularity.desc`)
          .then(r => r.ok ? r.json() : { results: [] })
          .catch(() => ({ results: [] }))
      : Promise.resolve({ results: [] });

    const seriesPromise = TMDB_API_KEY
      ? fetch(`${TMDB_BASE_URL}/discover/tv?api_key=${TMDB_API_KEY}&first_air_date.gte=${startDate}&first_air_date.lte=${endDate}&sort_by=popularity.desc`)
          .then(r => r.ok ? r.json() : { results: [] })
          .catch(() => ({ results: [] }))
      : Promise.resolve({ results: [] });

    const gamesPromise = RAWG_API_KEY
      ? fetch(`${RAWG_BASE_URL}/games?key=${RAWG_API_KEY}&dates=${startDate},${endDate}&ordering=-added`)
          .then(r => r.ok ? r.json() : { results: [] })
          .catch(() => ({ results: [] }))
      : Promise.resolve({ results: [] });

    const [moviesRes, seriesRes, gamesRes] = await Promise.all([
      moviePromise,
      seriesPromise,
      gamesPromise
    ]);

    const movies = (moviesRes.results || []).map((item: any) => ({
      external_id: `tmdb_movie_${item.id}`,
      media_type: 'movie' as const,
      title: item.title,
      poster_url: getTmdbImageUrl(item.poster_path),
      backdrop_url: getTmdbImageUrl(item.backdrop_path, 'backdrop'),
      release_date: item.release_date,
      rating: item.vote_average,
      genres: ['Movie']
    }));

    const series = (seriesRes.results || []).map((item: any) => ({
      external_id: `tmdb_series_${item.id}`,
      media_type: 'series' as const,
      title: item.name,
      poster_url: getTmdbImageUrl(item.poster_path),
      backdrop_url: getTmdbImageUrl(item.backdrop_path, 'backdrop'),
      release_date: item.first_air_date,
      rating: item.vote_average,
      genres: ['Series']
    }));

    const games = (gamesRes.results || []).map((item: any) => ({
      external_id: `rawg_game_${item.id}`,
      media_type: 'game' as const,
      title: item.name,
      poster_url: item.background_image || 'https://images.unsplash.com/photo-1616530940355-351fabd9524b?w=500&q=80',
      backdrop_url: item.background_image,
      release_date: item.released,
      rating: item.rating,
      genres: item.genres?.map((g: any) => g.name) || []
    }));

    return [...movies, ...series, ...games];
  }, { expiresInHours: 48, fallbackOnError: true }).catch(() => []);
};
