export const TMDB_API_KEY = import.meta.env.VITE_TMDB_API_KEY || '';
const RAWG_API_KEY = import.meta.env.VITE_RAWG_API_KEY || '';

export const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const RAWG_BASE_URL = 'https://api.rawg.io/api';

export interface MediaItem {
  external_id: string;
  media_type: 'movie' | 'series' | 'game';
  title: string;
  poster_url: string;
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

const getTmdbImageUrl = (path: string | null) => 
  path ? `https://image.tmdb.org/t/p/w342${path}` : 'https://images.unsplash.com/photo-1616530940355-351fabd9524b?w=342&q=80';

export const fetchTrendingMovies = async (lang = 'en-US'): Promise<MediaItem[]> => {
  if (!TMDB_API_KEY) return [];
  try {
    const res = await fetch(`${TMDB_BASE_URL}/trending/movie/week?api_key=${TMDB_API_KEY}&language=${lang}`).catch(() => null);
    if (!res || !res.ok) {
      console.warn('Failed to fetch trending movies:', res?.statusText);
      return [];
    }
    const data = await res.json();
    return data.results.map((item: any) => ({
      external_id: `tmdb_movie_${item.id}`,
      media_type: 'movie',
      title: item.title,
      poster_url: getTmdbImageUrl(item.poster_path),
      rating: item.vote_average,
      release_date: item.release_date,
      genres: ['Movie'],
      description: item.overview,
    }));
  } catch (error) {
    console.error('Error in fetchTrendingMovies:', error);
    return [];
  }
};

export const fetchTrendingSeries = async (lang = 'en-US'): Promise<MediaItem[]> => {
  if (!TMDB_API_KEY) return [];
  try {
    const res = await fetch(`${TMDB_BASE_URL}/trending/tv/week?api_key=${TMDB_API_KEY}&language=${lang}`).catch(() => null);
    if (!res || !res.ok) {
      console.warn('Failed to fetch trending series:', res?.statusText);
      return [];
    }
    const data = await res.json();
    return data.results.map((item: any) => ({
      external_id: `tmdb_series_${item.id}`,
      media_type: 'series',
      title: item.name,
      poster_url: getTmdbImageUrl(item.poster_path),
      rating: item.vote_average,
      release_date: item.first_air_date,
      genres: ['Series'],
      description: item.overview,
    }));
  } catch (error) {
    console.error('Error in fetchTrendingSeries:', error);
    return [];
  }
};

export const searchMedia = async (query: string): Promise<MediaItem[]> => {
  if (!TMDB_API_KEY || !query) return [];
  try {
    const res = await fetch(`${TMDB_BASE_URL}/search/multi?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}`).catch(() => null);
    if (!res || !res.ok) {
      console.warn('Search failed:', res?.statusText);
      return [];
    }
    const data = await res.json();
    return data.results
      .filter((item: any) => item.media_type === 'movie' || item.media_type === 'tv')
      .map((item: any) => ({
        external_id: `tmdb_${item.media_type === 'tv' ? 'series' : 'movie'}_${item.id}`,
        media_type: item.media_type === 'tv' ? 'series' : 'movie',
        title: item.title || item.name,
        poster_url: getTmdbImageUrl(item.poster_path),
        rating: item.vote_average,
        release_date: item.release_date || item.first_air_date,
        genres: [item.media_type === 'tv' ? 'Series' : 'Movie'],
        description: item.overview,
        status: item.status,
        next_episode_to_air: item.next_episode_to_air,
      }));
  } catch (error) {
    console.error('Search error:', error);
    return [];
  }
};

export const searchAnime = async (query: string): Promise<MediaItem[]> => {
  if (!query) return [];
  try {
    const res = await fetch(`https://api.jikan.moe/v4/anime?q=${encodeURIComponent(query)}&limit=3`).catch(() => null);
    if (!res || !res.ok) return [];
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
  } catch (error) {
    console.error('Error searching anime:', error);
    return [];
  }
};

export const fetchGames = async (search?: string): Promise<MediaItem[]> => {
  if (!RAWG_API_KEY) return [];
  try {
    const url = search 
      ? `${RAWG_BASE_URL}/games?key=${RAWG_API_KEY}&search=${encodeURIComponent(search)}`
      : `${RAWG_BASE_URL}/games?key=${RAWG_API_KEY}&ordering=-rating`;
    const res = await fetch(url).catch(() => null);
    if (!res || !res.ok) {
      console.warn('Failed to fetch games:', res?.statusText);
      return [];
    }
    const data = await res.json();
    return data.results.map((item: any) => ({
      external_id: `rawg_game_${item.id}`,
      media_type: 'game',
      title: item.name,
      poster_url: item.background_image || 'https://images.unsplash.com/photo-1616530940355-351fabd9524b?w=500&q=80',
      rating: item.rating,
      release_date: item.released,
      genres: item.genres?.map((g: any) => g.name) || [],
      description: '',
    }));
  } catch (error) {
    console.error('Error in fetchGames:', error);
    return [];
  }
};

export const fetchMediaVideos = async (mediaType: 'movie' | 'series', externalId: string): Promise<any[]> => {
  if (!TMDB_API_KEY) return [];
  const tmdbId = externalId.replace('tmdb_series_', '').replace('tmdb_movie_', '').replace('tmdb_', '');
  const type = mediaType === 'series' ? 'tv' : 'movie';
  try {
    const res = await fetch(`${TMDB_BASE_URL}/${type}/${tmdbId}/videos?api_key=${TMDB_API_KEY}`).catch(() => null);
    if (!res || !res.ok) return [];
    const data = await res.json();
    return data.results || [];
  } catch (error) {
    console.error('Error fetching videos:', error);
    return [];
  }
};

export const fetchSimilar = async (type: 'movie' | 'series', externalId: string): Promise<MediaItem[]> => {
  if (!TMDB_API_KEY) return [];
  const tmdbId = externalId.replace('tmdb_series_', '').replace('tmdb_movie_', '').replace('tmdb_', '');
  const endpoint = type === 'series' ? 'tv' : 'movie';
  try {
    const res = await fetch(`${TMDB_BASE_URL}/${endpoint}/${tmdbId}/similar?api_key=${TMDB_API_KEY}`);
    if (!res.ok) return [];
    const data = await res.json();
    return data.results.map((item: any) => ({
      external_id: `tmdb_${type === 'series' ? 'series' : 'movie'}_${item.id}`,
      media_type: type,
      title: item.title || item.name,
      poster_url: item.poster_path ? `https://image.tmdb.org/t/p/w342${item.poster_path}` : 'https://images.unsplash.com/photo-1616530940355-351fabd9524b?w=342&q=80',
      rating: item.vote_average,
      release_date: item.release_date || item.first_air_date,
      genres: [],
      description: item.overview,
    }));
  } catch (error) {
    console.error('Error fetching similar:', error);
    return [];
  }
};

export const fetchWatchProviders = async (type: 'movie' | 'series', externalId: string): Promise<any> => {
  if (!TMDB_API_KEY) return null;
  const tmdbId = externalId.replace('tmdb_series_', '').replace('tmdb_movie_', '').replace('tmdb_', '');
  const endpoint = type === 'series' ? 'tv' : 'movie';
  try {
    const res = await fetch(`${TMDB_BASE_URL}/${endpoint}/${tmdbId}/watch/providers?api_key=${TMDB_API_KEY}`);
    if (!res.ok) return null;
    const data = await res.json();
    return data.results || null;
  } catch (error) {
    console.error('Error fetching watch providers:', error);
    return null;
  }
};

export const fetchPopularMovies = async (lang = 'en-US'): Promise<MediaItem[]> => {
  if (!TMDB_API_KEY) return [];
  try {
    const res = await fetch(`${TMDB_BASE_URL}/movie/popular?api_key=${TMDB_API_KEY}&language=${lang}`);
    if (!res.ok) throw new Error('Failed to fetch popular movies');
    const data = await res.json();
    return data.results.map((item: any) => ({
      external_id: `tmdb_movie_${item.id}`,
      media_type: 'movie',
      title: item.title,
      poster_url: getTmdbImageUrl(item.poster_path),
      rating: item.vote_average,
      release_date: item.release_date,
      genres: ['Movie'],
      description: item.overview,
    }));
  } catch (error) {
    console.error(error);
    return [];
  }
};

export const fetchMoviesByGenre = async (genreId: string, lang = 'en-US'): Promise<MediaItem[]> => {
  if (!TMDB_API_KEY) return [];
  try {
    const res = await fetch(`${TMDB_BASE_URL}/discover/movie?api_key=${TMDB_API_KEY}&with_genres=${genreId}&language=${lang}`);
    if (!res.ok) throw new Error('Failed to fetch movies by genre');
    const data = await res.json();
    return data.results.map((item: any) => ({
      external_id: `tmdb_movie_${item.id}`,
      media_type: 'movie',
      title: item.title,
      poster_url: getTmdbImageUrl(item.poster_path),
      rating: item.vote_average,
      release_date: item.release_date,
      genres: ['Movie'],
      description: item.overview,
    }));
  } catch (error) {
    console.error(error);
    return [];
  }
};

export const fetchPopularSeries = async (lang = 'en-US'): Promise<MediaItem[]> => {
  if (!TMDB_API_KEY) return [];
  try {
    const res = await fetch(`${TMDB_BASE_URL}/tv/popular?api_key=${TMDB_API_KEY}&language=${lang}`);
    if (!res.ok) throw new Error('Failed to fetch popular series');
    const data = await res.json();
    return data.results.map((item: any) => ({
      external_id: `tmdb_series_${item.id}`,
      media_type: 'series',
      title: item.name,
      poster_url: getTmdbImageUrl(item.poster_path),
      rating: item.vote_average,
      release_date: item.first_air_date,
      genres: ['Series'],
      description: item.overview,
    }));
  } catch (error) {
    console.error(error);
    return [];
  }
};

export const fetchSeriesByGenre = async (genreId: string, lang = 'en-US'): Promise<MediaItem[]> => {
  if (!TMDB_API_KEY) return [];
  try {
    const res = await fetch(`${TMDB_BASE_URL}/discover/tv?api_key=${TMDB_API_KEY}&with_genres=${genreId}&language=${lang}`);
    if (!res.ok) throw new Error('Failed to fetch series by genre');
    const data = await res.json();
    return data.results.map((item: any) => ({
      external_id: `tmdb_series_${item.id}`,
      media_type: 'series',
      title: item.name,
      poster_url: getTmdbImageUrl(item.poster_path),
      rating: item.vote_average,
      release_date: item.first_air_date,
      genres: ['Series'],
      description: item.overview,
    }));
  } catch (error) {
    console.error(error);
    return [];
  }
};

export const fetchTopRatedGames = async (): Promise<MediaItem[]> => {
  if (!RAWG_API_KEY) return [];
  try {
    const res = await fetch(`${RAWG_BASE_URL}/games?key=${RAWG_API_KEY}&ordering=-metacritic&page_size=20`);
    if (!res.ok) throw new Error('Failed to fetch top rated games');
    const data = await res.json();
    return data.results.map((item: any) => ({
      external_id: `rawg_game_${item.id}`,
      media_type: 'game',
      title: item.name,
      poster_url: item.background_image || 'https://images.unsplash.com/photo-1616530940355-351fabd9524b?w=500&q=80',
      rating: item.rating,
      release_date: item.released,
      genres: item.genres?.map((g: any) => g.name) || [],
      description: '',
    }));
  } catch (error) {
    console.error(error);
    return [];
  }
};

export const fetchMediaDetails = async (id: string, type: 'movie' | 'series' | 'game', lang = 'en-US'): Promise<MediaItem | null> => {
  try {
    if (type === 'game' && RAWG_API_KEY) {
      const rawgId = id.replace('rawg_game_', '').replace('rawg_', '');
      const res = await fetch(`${RAWG_BASE_URL}/games/${rawgId}?key=${RAWG_API_KEY}`).catch(() => null);
      if (!res || !res.ok) return null;
      const item = await res.json();
      return {
        external_id: `rawg_game_${item.id}`,
        media_type: 'game',
        title: item.name,
        poster_url: item.background_image || 'https://images.unsplash.com/photo-1616530940355-351fabd9524b?w=500&q=80',
        rating: item.rating,
        metacritic: item.metacritic,
        release_date: item.released,
        genres: item.genres?.map((g: any) => g.name) || [],
        description: item.description_raw || item.description,
      };
    } else if (TMDB_API_KEY) {
      const tmdbId = id.replace('tmdb_movie_', '').replace('tmdb_series_', '').replace('tmdb_', '');
      const endpoint = type === 'movie' ? 'movie' : 'tv';
      const url = `${TMDB_BASE_URL}/${endpoint}/${tmdbId}?api_key=${TMDB_API_KEY}&append_to_response=videos,credits,similar&language=${lang}`;
      console.log(`[API Debug] Fetching TMDB details from URL: ${url}`);
      
      const res = await fetch(url).catch((err) => {
        console.error('[API Debug] Fetch failed:', err);
        return null;
      });
      
      if (!res || !res.ok) {
        console.error(`[API Debug] TMDB response not OK: ${res?.status} ${res?.statusText}`);
        return null;
      }
      
      const item = await res.json();
      console.log(`[API Debug] Raw TMDB response for ${id}:`, item);
      
      return {
        external_id: `tmdb_${type === 'series' ? 'series' : 'movie'}_${item.id}`,
        media_type: type,
        title: item.title || item.name,
        poster_url: getTmdbImageUrl(item.poster_path),
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
    }
    return null;
  } catch (error) {
    console.error('Error fetching media details:', error);
    return null;
  }
};

export const fetchCalendarReleases = async (startDate: string, endDate: string) => {
  try {
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
      release_date: item.release_date,
      rating: item.vote_average,
      genres: ['Movie']
    }));

    const series = (seriesRes.results || []).map((item: any) => ({
      external_id: `tmdb_series_${item.id}`,
      media_type: 'series' as const,
      title: item.name,
      poster_url: getTmdbImageUrl(item.poster_path),
      release_date: item.first_air_date,
      rating: item.vote_average,
      genres: ['Series']
    }));

    const games = (gamesRes.results || []).map((item: any) => ({
      external_id: `rawg_game_${item.id}`,
      media_type: 'game' as const,
      title: item.name,
      poster_url: item.background_image || 'https://images.unsplash.com/photo-1616530940355-351fabd9524b?w=500&q=80',
      release_date: item.released,
      rating: item.rating,
      genres: item.genres?.map((g: any) => g.name) || []
    }));

    return [...movies, ...series, ...games];
  } catch (error) {
    console.error('Error in fetchCalendarReleases:', error);
    return [];
  }
};
