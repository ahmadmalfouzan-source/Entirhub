import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Star, Calendar, BookOpen, Plus, Heart, Trash2, RotateCcw, Monitor, Play, X, Zap } from 'lucide-react';
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
import { ReviewSection } from '@/components/ReviewSection';
import { supabase } from '@/lib/supabase';
import { getDominantColor } from '@/lib/colorThief';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'motion/react';

export function ContentDetail() {
  const { id } = useParams();
  const [item, setItem] = useState<MediaItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [trailerKey, setTrailerKey] = useState<string | null>(null);
  const [showTrailer, setShowTrailer] = useState(false);
  const [accentColor, setAccentColor] = useState<string>('var(--color-primary)');
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

  const fetchedId = useRef<string | null>(null);
  const bgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (fetchedId.current === id) return;
    
    const loadData = async () => {
      if (!id) return;
      fetchedId.current = id;
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

      if (data) {
        getDominantColor(data.backdrop_url || data.poster_url).then(setAccentColor);
        
        if (data.media_type === 'movie' || data.media_type === 'series') {
          const videos = await fetchMediaVideos(data.media_type, data.external_id);
          const trailer = videos.find(v => v.type === 'Trailer' && v.site === 'YouTube');
          if (trailer) {
            setTrailerKey(trailer.key);
          }
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

  useEffect(() => {
    if (item) {
      console.log('Item data:', JSON.stringify(item));
    }
  }, [item]);

  useEffect(() => {
    if (item?.backdrop_url) {
      console.log('Backdrop URL:', item.backdrop_url);
      // Test if image loads
      const img = new Image();
      img.onload = () => console.log('Backdrop loaded successfully');
      img.onerror = () => console.log('Backdrop FAILED to load');
      img.src = item.backdrop_url;
    }
  }, [item]);

  const watchlistItem = watchlist.find(w => w.media?.external_id === item?.external_id);

  useEffect(() => {
    const fetchGameProgress = async () => {
      if (item?.media_type === 'game' && watchlistItem) {
        const { data: { session } } = await supabase.auth.getSession();
        const user = session?.user;
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

  const handleAddToList = () => {
    if (!item) return;
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

  useEffect(() => {
    if (!bgRef.current) return;
    let scale = 1;
    let direction = 1;
    let animationFrameId: number;

    const animate = () => {
      scale += 0.00005 * direction;
      if (scale >= 1.08) direction = -1;
      if (scale <= 1.0) direction = 1;
      
      if (bgRef.current) {
        bgRef.current.style.transform = `scale(${scale})`;
      }
      animationFrameId = requestAnimationFrame(animate);
    };
    
    animationFrameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrameId);
  }, [item]);

  const bgImage = item?.backdrop_url || item?.cover_url || item?.poster_url;

  return (
    <>
      <AnimatePresence>
        {bgImage && (
          <motion.div
            key={bgImage}
            ref={bgRef}
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.25 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            className="content-bg"
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100vw',
              height: '100vh',
              zIndex: 0,
              backgroundImage: `url(${bgImage})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              filter: 'brightness(0.6)', 
              pointerEvents: 'none',
              transform: 'scale(1)',
            }}
          />
        )}
      </AnimatePresence>
      
      <div style={{ position: 'relative', zIndex: 10 }}>
        {loading ? (
          <div className="p-8 text-foreground">Loading...</div>
        ) : !item ? (
          <div className="p-8 text-foreground">Content not found.</div>
        ) : (
          <div 
            className="min-h-screen pb-20 animate-in fade-in duration-700 ease-in-out"
            style={{ '--accent-color': accentColor } as React.CSSProperties}
          >
          {/* Hero Banner */}
      <div className="h-[40vh] md:h-[65vh] relative flex items-end">
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-background)] via-transparent to-transparent pointer-events-none" />
        
        <div className="relative w-full p-4 md:p-12 max-w-7xl mx-auto flex flex-col md:flex-row items-center md:items-end gap-6 md:gap-12 translate-y-20 md:translate-y-24">
          <div className="relative group shrink-0">
            <div 
              className="absolute -inset-1 rounded-2xl blur-xl opacity-40 group-hover:opacity-60 transition-opacity duration-500"
              style={{ backgroundColor: 'var(--accent-color)' }}
            />
            <img 
              src={item.poster_url || 'https://images.unsplash.com/photo-1616530940355-351fabd9524b?w=500&q=80'} 
              alt={item.title}
              className="w-48 md:w-72 rounded-xl shadow-2xl border border-white/10 relative"
            />
          </div>

          <div className="flex-1 text-center md:text-left">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mb-4 md:mb-6">
              <Badge 
                style={{ backgroundColor: `${accentColor}20`, color: accentColor, borderColor: `${accentColor}40` }}
                className="capitalize px-4 py-1 text-sm font-bold border"
              >
                {item.media_type}
              </Badge>
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-yellow-500/10 text-yellow-500 font-bold border border-yellow-500/20 shadow-lg shadow-yellow-500/10">
                <Star className="w-4 h-4 fill-current" />
                {item.rating > 0 ? item.rating.toFixed(1) : 'N/A'}
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 text-muted-foreground font-medium border border-white/10">
                <Calendar className="w-4 h-4" />
                {item.release_date ? new Date(item.release_date).getFullYear() : 'N/A'}
              </div>
            </div>

            <h1 className="text-3xl md:text-6xl font-black text-white mb-4 md:mb-8 tracking-tighter drop-shadow-2xl">
              {item.title}
            </h1>

            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mb-8 md:mb-10">
              {item.genres?.map((genre: string) => (
                <span key={genre} className="px-3 py-1 rounded-md text-xs font-bold uppercase tracking-widest text-[#94a3b8] bg-white/5 border border-white/10 hover:border-white/20 transition-colors">
                  {genre}
                </span>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4">
              {!watchlistItem ? (
                <Button 
                  onClick={handleAddToList} 
                  className="w-full sm:w-auto px-8 h-12 text-base font-bold text-white border-0 shadow-lg transition-all duration-300 hover:scale-105 active:scale-95"
                  style={{ 
                    background: `linear-gradient(45deg, ${accentColor}, ${accentColor}cc)`,
                    boxShadow: `0 8px 24px -6px ${accentColor}60`
                  }}
                >
                  <Plus className="w-5 h-5 mr-2" /> {t('addToLibrary')}
                </Button>
              ) : (
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 w-full sm:w-auto">
                  <Select value={watchlistItem.status} onValueChange={handleStatusChange}>
                    <SelectTrigger className="w-[180px] h-12 bg-white/10 backdrop-blur-md border-white/10 text-white font-medium hover:bg-white/20 transition-all">
                      <SelectValue placeholder={t('status')} />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1a1f2e] border-white/10">
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
                      className="h-12 border-white/10 bg-white/10 hover:bg-white/20 text-white font-medium px-6"
                    >
                      <RotateCcw className="w-5 h-5 mr-2" />
                      Rewatch {watchlistItem.rewatch_count ? `(${watchlistItem.rewatch_count}x)` : ''}
                    </Button>
                  )}

                  <Button variant="destructive" onClick={handleRemove} size="icon" className="h-12 w-12 rounded-xl">
                    <Trash2 className="w-5 h-5" />
                  </Button>
                </div>
              )}

              {trailerKey && !showTrailer && (
                <Button 
                  onClick={() => setShowTrailer(true)} 
                  variant="outline"
                  className="h-12 px-8 border-white/10 bg-white/5 hover:bg-white/10 text-white font-bold backdrop-blur-md"
                >
                  <Play className="w-5 h-5 mr-3 fill-current text-red-500" /> {t('watchTrailer')}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content Details */}
      <div className="max-w-7xl mx-auto p-4 md:p-8 pt-40 md:pt-52 grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 space-y-12">
          <section className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 md:p-8 space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                <BookOpen className="w-5 h-5" style={{ color: accentColor }} />
                {t('overview')}
              </h2>
              <p className="text-[#94a3b8] leading-relaxed text-lg">
                {item.description || 'No description available.'}
              </p>
            </div>

            {item.media_type === 'game' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-white/5">
                <Link to={`/wiki/${item.external_id}`} className="w-full">
                  <Button variant="secondary" className="bg-white/5 text-silver hover:bg-white/10 border border-white/5 w-full h-14 text-base font-bold">
                    <BookOpen className="w-5 h-5 mr-3" /> Open Strategy Wiki
                  </Button>
                </Link>
                {item.media_type === 'game' && watchlistItem && (
                   <Button 
                    onClick={handleToggle100}
                    variant="outline" 
                    className={`h-14 w-full text-base font-bold transition-all ${watchlistItem.is_completed_100 ? 'bg-yellow-500/20 text-yellow-500 border-yellow-500/50' : 'bg-white/5 text-white border-white/5'}`}
                   >
                    <Heart className={`w-5 h-5 mr-3 ${watchlistItem.is_completed_100 ? 'fill-current' : ''}`} />
                    Completionist 100%
                   </Button>
                )}
              </div>
            )}
          </section>


          {/* Cast Section */}
          {item.credits && item.credits.cast && item.credits.cast.length > 0 && (
            <section className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 md:p-8">
              <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <Star className="w-5 h-5" style={{ color: accentColor }} />
                Cast & Crew
              </h3>
              <div className="flex overflow-x-auto space-x-6 pb-4 scrollbar-hide">
                {item.credits.cast.slice(0, 8).map((actor: any) => (
                  <div key={actor.id} className="flex-shrink-0 w-32 group">
                    <div className="relative mb-3">
                      <div 
                        className="absolute -inset-0.5 rounded-xl blur opacity-0 group-hover:opacity-40 transition-opacity duration-300"
                        style={{ backgroundColor: accentColor }}
                      />
                      <img 
                        src={actor.profile_path ? `https://image.tmdb.org/t/p/w185${actor.profile_path}` : 'https://placehold.co/185x278?text=No+Photo'}
                        alt={actor.name}
                        className="w-full aspect-[2/3] object-cover rounded-xl relative border border-white/10"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <p className="font-bold text-sm text-white truncate">{actor.name}</p>
                    <p className="text-xs text-[#94a3b8] truncate">{actor.character}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Watch Providers Section */}
          {item.media_type !== 'game' && (
            <section className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 md:p-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <Monitor className="w-5 h-5" style={{ color: accentColor }} />
                  Streaming On
                </h3>
                <Select value={region} onValueChange={(v) => { setRegion(v); localStorage.setItem('watchRegion', v); }}>
                  <SelectTrigger className="w-[180px] bg-white/5 border-white/10 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a1f2e] border-white/10">
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
                    <div key={p.provider_id} className="group relative">
                      <div 
                        className="absolute -inset-1 rounded-lg blur opacity-0 group-hover:opacity-40 transition-opacity"
                        style={{ backgroundColor: accentColor }}
                      />
                      <img 
                        src={`https://image.tmdb.org/t/p/w92${p.logo_path}`} 
                        alt={p.provider_name} 
                        className="w-12 h-12 rounded-xl relative border border-white/10 shadow-lg"
                        referrerPolicy="no-referrer"
                        title={p.provider_name}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[#94a3b8] italic">No active providers found for this region.</p>
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
            <section className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 md:p-8">
              <div className="flex items-center gap-3 mb-8">
                <Zap className="w-6 h-6" style={{ color: accentColor }} />
                <h3 className="text-xl font-bold text-white">Achievement Tracker</h3>
              </div>
              <GameAchievementTracker gameName={item.title} mediaId={watchlistItem.media_id} externalId={item.external_id} />
            </section>
          )}

          <section className="pt-8 md:pt-12 border-t border-white/5">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <Star className="w-5 h-5" style={{ color: accentColor }} />
              User Reviews
            </h3>
            <ReviewSection mediaId={item.external_id} />
          </section>
        </div>
        
        <div className="space-y-8">
          {watchlistItem && (
            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 space-y-6 shadow-xl relative overflow-hidden group">
              <div 
                className="absolute top-0 right-0 w-32 h-32 blur-3xl opacity-20 transition-opacity group-hover:opacity-40"
                style={{ backgroundColor: accentColor }}
              />
              
              <h3 className="font-bold text-white text-lg flex items-center gap-2">
                <div className="w-1 h-5 rounded-full" style={{ backgroundColor: accentColor }} />
                {t('yourTracking')}
              </h3>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">{t('status')}</span>
                  <Badge 
                    variant="outline"
                    className="capitalize font-bold border-white/10 bg-white/5"
                    style={{ color: accentColor, borderColor: `${accentColor}40` }}
                  >
                    {watchlistItem.status ? t(watchlistItem.status.replace('_', '') as keyof typeof translations.en) || watchlistItem.status.replace('_', ' ') : t('notTracked')}
                  </Badge>
                </div>

                {item.media_type === 'game' && (
                  <>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">Platform</span>
                      <Select value={watchlistItem.platform || ''} onValueChange={handlePlatformChange}>
                        <SelectTrigger className="w-[120px] h-8 bg-white/5 border-white/10 text-xs">
                          <SelectValue placeholder="Set Platform" />
                        </SelectTrigger>
                        <SelectContent className="bg-[#1a1f2e] border-white/10">
                          <SelectItem value="PS5">PS5</SelectItem>
                          <SelectItem value="PS4">PS4</SelectItem>
                          <SelectItem value="PC">PC</SelectItem>
                          <SelectItem value="Xbox">Xbox</SelectItem>
                          <SelectItem value="Nintendo Switch">Nintendo Switch</SelectItem>
                          <SelectItem value="Mobile">Mobile</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Hours Played</span>
                        <span className="text-white font-bold">{watchlistItem.hours_played || 0}h</span>
                      </div>
                      <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                        <div 
                          className="h-full rounded-full transition-all duration-1000"
                          style={{ 
                            width: `${Math.min((watchlistItem.hours_played || 0) / 100 * 100, 100)}%`,
                            backgroundColor: accentColor,
                            boxShadow: `0 0 10px ${accentColor}80`
                          }}
                        />
                      </div>
                      <input 
                        type="range" 
                        min="0" 
                        max="200" 
                        step="0.5"
                        value={watchlistItem.hours_played || 0} 
                        onChange={(e) => updateHoursPlayed(watchlistItem.id, parseFloat(e.target.value))}
                        className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-primary"
                        style={{ accentColor }}
                      />
                    </div>
                  </>
                )}

                <div className="pt-4 border-t border-white/5">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">{t('yourRating')}</span>
                    <span className="text-xl font-black" style={{ color: accentColor }}>
                      {watchlistItem.rating ? `${watchlistItem.rating}/5` : '--'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between px-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => handleRatingChange(star)}
                        className="p-1 transition-all hover:scale-125"
                      >
                        <Star 
                          className={cn(
                            "w-6 h-6 transition-colors",
                            (watchlistItem.rating || 0) >= star ? "fill-current" : "text-white/10"
                          )} 
                          style={{ color: (watchlistItem.rating || 0) >= star ? accentColor : undefined }}
                        />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
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
        )}
      </div>
    </>
  );
}
