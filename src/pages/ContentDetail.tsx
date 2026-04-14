import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Star, Calendar, BookOpen, Plus, Heart, Trash2, RotateCcw, Monitor, Play, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { fetchMediaDetails, fetchMediaVideos, MediaItem } from '@/services/api';
import { useStore } from '@/store/useStore';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { EpisodeTracker } from '@/components/EpisodeTracker';
import { useTranslation } from '@/hooks/useTranslation';
import { translations } from '@/i18n/translations';

export function ContentDetail() {
  const { id } = useParams();
  const [item, setItem] = useState<MediaItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [trailerKey, setTrailerKey] = useState<string | null>(null);
  const [showTrailer, setShowTrailer] = useState(false);
  const { t } = useTranslation();
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

      let data = await fetchMediaDetails(id, fetchedType);
      
      // If failed and was tmdb, try the other type as fallback
      if (!data && id.startsWith('tmdb_')) {
        const otherType = fetchedType === 'movie' ? 'series' : 'movie';
        data = await fetchMediaDetails(id, otherType);
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
    };
    loadData();
  }, [id]);

  if (loading) return <div className="p-8 text-foreground">Loading...</div>;
  if (!item) return <div className="p-8 text-foreground">Content not found.</div>;

  const watchlistItem = watchlist.find(w => w.media?.external_id === item.external_id);

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
    <div className="pb-20">
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
                {item.rating?.toFixed(1)}
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
                  <Play className="w-4 h-4 mr-2" /> Watch Trailer
                </Button>
              )}
            </div>
            <div className="flex items-center gap-4">
              {!watchlistItem ? (
                <Button onClick={handleAddToList} className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0">
                  <Plus className="w-4 h-4 mr-2" /> {t('addToLibrary')}
                </Button>
              ) : (
                <div className="flex flex-wrap items-center gap-2">
                  <Select value={watchlistItem.status} onValueChange={handleStatusChange}>
                    <SelectTrigger className="w-[160px] bg-white/10 border-border text-foreground">
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
                      className="bg-white/10 border-border text-foreground hover:bg-white/20"
                    >
                      <RotateCcw className="w-4 h-4 mr-2" />
                      Rewatch {watchlistItem.rewatch_count ? `(${watchlistItem.rewatch_count}x)` : ''}
                    </Button>
                  )}

                  {item.media_type === 'game' && (
                    <div className="flex items-center gap-2">
                      <Select value={watchlistItem.platform || ''} onValueChange={handlePlatformChange}>
                        <SelectTrigger className="w-[160px] bg-white/10 border-border text-foreground">
                          <Monitor className="w-4 h-4 mr-2" />
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
                      
                      <div className="flex items-center gap-2 bg-white/10 border border-border rounded-md px-3 h-10">
                        <span className="text-xs text-muted-foreground">Hours</span>
                        <input 
                          type="number" 
                          value={watchlistItem.hours_played || 0} 
                          onChange={handleHoursChange}
                          className="bg-transparent border-none text-foreground w-12 text-sm focus:outline-none"
                        />
                      </div>

                      <Button 
                        onClick={handleToggle100}
                        variant="outline" 
                        className={`border-border ${watchlistItem.is_completed_100 ? 'bg-yellow-500/20 text-yellow-500 border-yellow-500/50' : 'bg-white/10 text-foreground'}`}
                      >
                        <Heart className={`w-4 h-4 mr-2 ${watchlistItem.is_completed_100 ? 'fill-current' : ''}`} />
                        100%
                      </Button>
                    </div>
                  )}

                  <Button variant="destructive" onClick={handleRemove} size="icon">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              )}
              {item.media_type === 'game' && (
                <Link to={`/wiki/${item.external_id}`}>
                  <Button variant="secondary" className="bg-white/10 text-foreground hover:bg-white/20 border-0">
                    <BookOpen className="w-4 h-4 mr-2" /> Open Wiki
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

          {item.media_type === 'series' && (
            <section className="pt-4 md:pt-8">
              {watchlistItem ? (
                <EpisodeTracker mediaId={watchlistItem.media_id} externalId={item.external_id} />
              ) : (
                <div className="bg-card border border-border rounded-xl md:rounded-2xl p-6 md:p-8 text-center">
                  <p className="text-muted-foreground">Add to library to track episodes</p>
                </div>
              )}
            </section>
          )}
        </div>
        
        <div className="space-y-6">
          <div className="bg-card border border-border rounded-xl p-6">
            <h3 className="font-semibold text-foreground mb-4">{t('yourTracking')}</h3>
            <div className="space-y-4 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>{t('status')}</span>
                <span className="text-foreground capitalize">{watchlistItem?.status ? t(watchlistItem.status.replace('_', '') as keyof typeof translations.en) || watchlistItem.status.replace('_', ' ') : 'Not Tracked'}</span>
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
                <span>{t('yourRating')}</span>
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
