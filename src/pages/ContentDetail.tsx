import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Star, Calendar, BookOpen, Plus, Heart, Trash2, RotateCcw, Monitor, Play, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { fetchMediaDetails, fetchMediaVideos, fetchWatchProviders, fetchSimilar, MediaItem } from '@/services/api';
import { useStore } from '@/store/useStore';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { EpisodeTracker } from '@/components/EpisodeTracker';
import { GameAchievementTracker } from '@/components/GameAchievementTracker';
import { ContentCard } from '@/components/ContentCard';
import { useTranslation } from '@/hooks/useTranslation';
import { useLanguageStore } from '@/store/useLanguageStore';
import { translations } from '@/i18n/translations';
import { supabase } from '@/lib/supabase';

export function ContentDetail() {
  const { id } = useParams();
  const [item, setItem] = useState<MediaItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [trailerKey, setTrailerKey] = useState<string | null>(null);
  const [showTrailer, setShowTrailer] = useState(false);
  const [watchProviders, setWatchProviders] = useState<any | null>(null);
  const [region, setRegion] = useState(() => localStorage.getItem('watchRegion') || 'SA');
  const [similarTitles, setSimilarTitles] = useState<MediaItem[]>([]);
  const { t } = useTranslation();
  const { language } = useLanguageStore();
  const { 
    watchlist, 
    addToWatchlist, 
    updateWatchlistItem, 
    removeFromWatchlist, 
    incrementRewatch, 
    updatePlatform,
    updateHoursPlayed,
    toggle100Completion
  } = useStore();

  useEffect(() => {
    const loadData = async () => {
      if (!id) return;
      setLoading(true);
      
      let fetchedType: 'movie' | 'series' | 'game' = 'movie';
      if (id.includes('_game_')) {
        fetchedType = 'game';
      } else if (id.includes('_series_')) {
        fetchedType = 'series';
      } else if (id.includes('_movie_')) {
        fetchedType = 'movie';
      } else {
        // Fallback for old IDs or ambiguous ones
        if (id.startsWith('rawg_')) fetchedType = 'game';
        else if (id.includes('tv')) fetchedType = 'series';
      }

      const lang = language === 'ar' ? 'ar-SA' : 'en-US';
      let data = await fetchMediaDetails(id, fetchedType, lang);
      
      // If failed and was tmdb, try the other type as fallback
      if (!data && id.startsWith('tmdb_')) {
        const otherType = fetchedType === 'movie' ? 'series' : 'movie';
        data = await fetchMediaDetails(id, otherType, lang);
      }
      
      setItem(data);

      if (data && (data.media_type === 'movie' || data.media_type === 'series')) {
        const videos = await fetchMediaVideos(data.media_type, data.external_id);
        const trailer = videos.find(v => v.type === 'Trailer' && v.site === 'YouTube');
        if (trailer) {
          setTrailerKey(trailer.key);
        }
      }

      setLoading(false);

      if (data && data.media_type !== 'game') {
        fetchWatchProviders(data.media_type, data.external_id).then(setWatchProviders);
        fetchSimilar(data.media_type, data.external_id).then(setSimilarTitles);
      }
    };
    loadData();
  }, [id]);

  const watchlistItem = watchlist.find(w => w.media?.external_id === item?.external_id);

  useEffect(() => {
    const fetchGameProgress = async () => {
      if (item?.media_type === 'game' && watchlistItem) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        
        const mediaId = watchlistItem.media_id;
        console.log('media_id:', mediaId);
        
        const { data, error } = await supabase
          .from('game_progress')
          .select('*')
          .eq('user_id', user.id)
          .eq('media_id', mediaId);
          
        if (error) {
          console.error('Error fetching game progress:', error);
        } else {
          console.log('number of rows fetched:', data?.length);
        }
      }
    };
    fetchGameProgress();
  }, [item, watchlistItem]);

  if (loading) return <div className="p-8 text-foreground">Loading...</div>;
  if (!item) return <div className="p-8 text-foreground">Content not found.</div>;

  const handleAddToList = () => {
    addToWatchlist({
      external_id: item.external_id,
      media_type: item.media_type,
      status: 'planned',
      title: item.title,
      cover_url: item.poster_url,
    });
  };

  const handleStatusChange = (value: any) => {
    if (watchlistItem) {
      updateWatchlistItem(watchlistItem.id, { status: value });
    }
  };

  const handleRatingChange = (rating: number) => {
    if (watchlistItem) {
      updateWatchlistItem(watchlistItem.id, { rating });
    }
  };

  const handleRemove = () => {
    if (watchlistItem) {
      removeFromWatchlist(watchlistItem.id);
    }
  };

  const handleRewatch = () => {
    if (watchlistItem) {
      incrementRewatch(watchlistItem.id, watchlistItem.rewatch_count || 0);
    }
  };

  const handlePlatformChange = (value: string) => {
    if (watchlistItem) {
      updatePlatform(watchlistItem.id, value);
    }
  };

  const handleHoursChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const hours = parseFloat(e.target.value);
    if (watchlistItem && !isNaN(hours)) {
      updateHoursPlayed(watchlistItem.id, hours);
    }
  };

  const handleToggle100 = () => {
    if (watchlistItem) {
      toggle100Completion(watchlistItem.id, !watchlistItem.is_completed_100);
    }
  };

  return (
    <div className="pb-20 animate-in fade-in slide-in-from-bottom-4 duration-300 ease-in-out">
      {/* Hero Banner */}
      <div className="h-[40vh] md:h-[60vh] relative">
        <img 
          src={item.poster_url || 'https://images.unsplash.com/photo-1616530940355-351fabd9524b?w=1200&q=80'} 
          alt={item.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
        
        <div className="absolute bottom-0 left-0 right-0 p-4 md:p-8 max-w-7xl mx-auto flex items-end gap-8">
          <img 
            src={item.poster_url || 'https://images.unsplash.com/photo-1616530940355-351fabd9524b?w=500&q=80'} 
            alt={item.title}
            className="w-64 rounded-xl shadow-2xl border border-border hidden md:block"
          />
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2 md:mb-4">
              <Badge variant="secondary" className="bg-primary/20 text-primary hover:bg-primary/30 capitalize">
                {item.media_type}
              </Badge>
              <div className="flex items-center gap-1 text-yellow-400 font-medium text-sm md:text-base">
                <Star className="w-4 h-4 fill-current" />
                {item.rating > 0 ? item.rating.toFixed(1) : 'N/A'}
              </div>
              <div className="text-muted-foreground flex items-center gap-1 text-sm md:text-base">
                <Calendar className="w-4 h-4" />
                {item.release_date ? new Date(item.release_date).getFullYear() : 'N/A'}
              </div>
            </div>
            <h1 className="text-2xl md:text-5xl font-bold text-foreground mb-2 md:mb-4">{item.title}</h1>
            <div className="flex flex-wrap gap-2 mb-4 md:mb-6">
              {item.genres?.map((genre: string) => (
                <Badge key={genre} variant="outline" className="border-border text-muted-foreground">
                  {genre}
                </Badge>
              ))}
            </div>
            <div className="flex items-center gap-4 mb-4 md:mb-6">
              {trailerKey && (
                <Button 
                  onClick={() => setShowTrailer(true)} 
                  className="bg-red-600 hover:bg-red-700 text-white border-0"
                >
                  <Play className="w-4 h-4 mr-2" /> {t('watchTrailer')}
                </Button>
              )}
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 md:gap-4">
              {!watchlistItem ? (
                <Button onClick={handleAddToList} className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0 w-full sm:w-auto h-12 sm:h-10 text-base sm:text-sm">
                  <Plus className="w-5 h-5 sm:w-4 sm:h-4 mr-2" /> {t('addToLibrary')}
                </Button>
              ) : (
                <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2 w-full sm:w-auto">
                  <Select value={watchlistItem.status} onValueChange={handleStatusChange}>
                    <SelectTrigger className="w-full sm:w-[160px] h-12 sm:h-10 bg-white/10 border-border text-foreground">
                      <SelectValue placeholder={t('status')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="planned">{t('planned')}</SelectItem>
                      <SelectItem value="watch_tonight">{t('watchTonight')}</SelectItem>
                      <SelectItem value="watching">{t('watching')}</SelectItem>
                      <SelectItem value="completed">{t('completed')}</SelectItem>
                      <SelectItem value="on_hold">{t('onHold')}</SelectItem>
                      <SelectItem value="dropped">{t('dropped')}</SelectItem>
                    </SelectContent>
                  </Select>

                  {item.media_type === 'movie' && (
                    <Button 
                      onClick={handleRewatch}
                      variant="outline" 
                      className="bg-white/10 border-border text-foreground hover:bg-white/20 h-12 sm:h-10 w-full sm:w-auto"
                    >
                      <RotateCcw className="w-5 h-5 sm:w-4 sm:h-4 mr-2" />
                      Rewatch {watchlistItem.rewatch_count ? `(${watchlistItem.rewatch_count}x)` : ''}
                    </Button>
                  )}

                  {item.media_type === 'game' && (
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
                      <Select value={watchlistItem.platform || ''} onValueChange={handlePlatformChange}>
                        <SelectTrigger className="w-full sm:w-[160px] h-12 sm:h-10 bg-white/10 border-border text-foreground">
                          <Monitor className="w-5 h-5 sm:w-4 sm:h-4 mr-2" />
                          <SelectValue placeholder="Platform" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="PS5">PS5</SelectItem>
                          <SelectItem value="PS4">PS4</SelectItem>
                          <SelectItem value="PC">PC</SelectItem>
                          <SelectItem value="Xbox">Xbox</SelectItem>
                          <SelectItem value="Nintendo Switch">Nintendo Switch</SelectItem>
                          <SelectItem value="Mobile">Mobile</SelectItem>
                        </SelectContent>
                      </Select>
                      
                      <div className="flex items-center justify-between sm:justify-start gap-2 bg-white/10 border border-border rounded-md px-4 sm:px-3 h-12 sm:h-10">
                        <span className="text-sm sm:text-xs text-muted-foreground">Hours</span>
                        <input 
                          type="number" 
                          value={watchlistItem.hours_played || 0} 
                          onChange={handleHoursChange}
                          className="bg-transparent border-none text-foreground w-16 sm:w-12 text-base sm:text-sm focus:outline-none text-right sm:text-left"
                        />
                      </div>

                      <Button 
                        onClick={handleToggle100}
                        variant="outline" 
                        className={`border-border h-12 sm:h-10 w-full sm:w-auto ${watchlistItem.is_completed_100 ? 'bg-yellow-500/20 text-yellow-500 border-yellow-500/50' : 'bg-white/10 text-foreground'}`}
                      >
                        <Heart className={`w-5 h-5 sm:w-4 sm:h-4 mr-2 ${watchlistItem.is_completed_100 ? 'fill-current' : ''}`} />
                        100%
                      </Button>
                    </div>
                  )}

                  <Button variant="destructive" onClick={handleRemove} size="icon" className="h-12 w-12 sm:h-10 sm:w-10 hidden sm:flex">
                    <Trash2 className="w-5 h-5 sm:w-4 sm:h-4" />
                  </Button>
                  <Button variant="destructive" onClick={handleRemove} className="h-12 w-full sm:hidden flex items-center justify-center">
                    <Trash2 className="w-5 h-5 mr-2" /> Remove from Library
                  </Button>
                </div>
              )}
              {item.media_type === 'game' && (
                <Link to={`/wiki/${item.external_id}`} className="w-full sm:w-auto">
                  <Button variant="secondary" className="bg-white/10 text-foreground hover:bg-white/20 border-0 w-full sm:w-auto h-12 sm:h-10">
                    <BookOpen className="w-5 h-5 sm:w-4 sm:h-4 mr-2" /> Open Wiki
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content Details */}
      <div className="max-w-7xl mx-auto p-4 md:p-8 grid grid-cols-1 lg:grid-cols-3 gap-8 md:gap-12">
        <div className="lg:col-span-2 space-y-6 md:space-y-8">
          <section>
            <h2 className="text-xl md:text-2xl font-bold text-foreground mb-2 md:mb-4">{t('overview')}</h2>
            <p className="text-muted-foreground leading-relaxed text-base md:text-lg">
              {item.description || 'No description available.'}
            </p>
          </section>

          {/* Cast Section */}
          {item.credits && item.credits.cast && item.credits.cast.length > 0 && (
            <section className="pt-4 md:pt-8">
              <h3 className="text-lg md:text-xl font-bold text-foreground mb-4">Cast</h3>
              <div className="flex overflow-x-auto space-x-4 pb-4">
                {item.credits.cast.slice(0, 6).map((actor: any) => (
                  <div key={actor.id} className="flex-shrink-0 w-32">
                    <img 
                      src={actor.profile_path ? `https://image.tmdb.org/t/p/w185${actor.profile_path}` : 'https://placehold.co/185x278?text=No+Photo'}
                      alt={actor.name}
                      className="w-full aspect-[2/3] object-cover rounded-lg mb-2"
                      referrerPolicy="no-referrer"
                    />
                    <p className="font-bold text-sm text-foreground">{actor.name}</p>
                    <p className="text-xs text-muted-foreground">{actor.character}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Watch Providers Section */}
          {item.media_type !== 'game' && (
            <section className="pt-4 md:pt-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg md:text-xl font-bold text-foreground">Where to Watch</h3>
                <Select value={region} onValueChange={(v) => { setRegion(v); localStorage.setItem('watchRegion', v); }}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SA">🇸🇦 Saudi Arabia</SelectItem>
                    <SelectItem value="US">🇺🇸 United States</SelectItem>
                    <SelectItem value="GB">🇬🇧 United Kingdom</SelectItem>
                    <SelectItem value="AE">🇦🇪 United Arab Emirates</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {watchProviders && watchProviders[region] && (watchProviders[region].flatrate || watchProviders[region].rent || watchProviders[region].buy) ? (
                <div className="flex items-center gap-4 flex-wrap">
                  {[...new Map([...(watchProviders[region].flatrate || []), ...(watchProviders[region].rent || []), ...(watchProviders[region].buy || [])].map(p => [p.provider_id, p])).values()].map((p: any) => (
                    <div key={p.provider_id} className="tooltip" title={p.provider_name}>
                      <img 
                        src={`https://image.tmdb.org/t/p/w92${p.logo_path}`} 
                        alt={p.provider_name} 
                        className="w-10 h-10 rounded-md"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">Not available in your region</p>
              )}
            </section>
          )}

          {/* Similar Titles Section */}
          {similarTitles.length > 0 && (
            <section className="pt-4 md:pt-8">
              <h3 className="text-lg md:text-xl font-bold text-foreground mb-4">You Might Also Like</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {similarTitles.slice(0, 6).map((item) => (
                  <ContentCard key={item.external_id} item={item} />
                ))}
              </div>
            </section>
          )}

          {item.media_type === 'series' && (
            <section className="pt-4 md:pt-8">
              {watchlistItem ? (
                <EpisodeTracker mediaId={watchlistItem.media_id} externalId={item.external_id} />
              ) : (
                <div className="bg-card border border-border rounded-xl md:rounded-2xl p-6 md:p-8 text-center">
                  <p className="text-muted-foreground">{t('addToLibraryToTrack')}</p>
                </div>
              )}
            </section>
          )}

          {item.media_type === 'game' && watchlistItem && (
            <section className="pt-4 md:pt-8">
              <GameAchievementTracker gameName={item.title} mediaId={watchlistItem.media_id} externalId={item.external_id} />
            </section>
          )}
        </div>
        
        <div className="space-y-6">
          <div className="bg-card border border-border rounded-xl p-6">
            <h3 className="font-semibold text-foreground mb-4">{t('yourTracking')}</h3>
            <div className="space-y-4 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>{t('status')}</span>
                <span className="text-foreground capitalize">{watchlistItem?.status ? t(watchlistItem.status.replace('_', '') as keyof typeof translations.en) || watchlistItem.status.replace('_', ' ') : t('notTracked')}</span>
              </div>
              {watchlistItem?.rewatch_count ? (
                <div className="flex justify-between text-muted-foreground">
                  <span>Rewatched</span>
                  <span className="text-foreground">{watchlistItem.rewatch_count}x</span>
                </div>
              ) : null}
              {watchlistItem?.platform && (
                <div className="flex justify-between text-muted-foreground">
                  <span>Platform</span>
                  <span className="text-foreground">{watchlistItem.platform}</span>
                </div>
              )}
              <div className="flex justify-between items-center text-muted-foreground">
                <div className="flex items-center gap-2">
                  <span>{t('yourRating')}</span>
                  {item && item.media_type === 'game' && item.metacritic && (
                    <div className={`px-1.5 py-0.5 rounded text-[10px] font-bold text-white ${
                      item.metacritic >= 75 ? 'bg-green-600' : 
                      item.metacritic >= 50 ? 'bg-yellow-600' : 'bg-red-600'
                    }`}>
                      MC: {item.metacritic}
                    </div>
                  )}
                </div>
                {watchlistItem ? (
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => handleRatingChange(star)}
                        className={`hover:scale-110 transition-transform ${
                          (watchlistItem.rating || 0) >= star ? 'text-yellow-400' : 'text-gray-600'
                        }`}
                      >
                        <Star className={`w-5 h-5 ${(watchlistItem.rating || 0) >= star ? 'fill-current' : ''}`} />
                      </button>
                    ))}
                  </div>
                ) : (
                  <span className="text-foreground">--</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Trailer Modal */}
      {showTrailer && trailerKey && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4">
          <div className="relative w-full max-w-5xl aspect-video bg-black rounded-xl overflow-hidden shadow-2xl">
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 z-10 text-white hover:bg-white/20 bg-black/50 rounded-full"
              onClick={() => setShowTrailer(false)}
            >
              <X className="w-6 h-6" />
            </Button>
            <iframe
              src={`https://www.youtube.com/embed/${trailerKey}?autoplay=1`}
              title="Trailer"
              className="w-full h-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>
      )}
    </div>
  );
}
