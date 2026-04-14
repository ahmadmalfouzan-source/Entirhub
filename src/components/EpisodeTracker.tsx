import React, { useEffect, useState } from 'react';
import { 
  fetchSeasons, 
  fetchSeasonEpisodes, 
  getWatchedEpisodes, 
  markEpisodeWatched, 
  unmarkEpisodeWatched, 
  markSeasonWatched,
  getLastWatchedEpisode,
  getSeasonProgress,
  getTotalProgress,
  getSeasonRatings,
  saveSeasonRating,
  Season,
  WatchedEpisode,
  Episode,
  SeasonRating
} from '@/services/episodes';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { CheckCircle2, ChevronDown, ChevronUp, PlayCircle, Star } from 'lucide-react';
import { toast } from 'sonner';

interface EpisodeTrackerProps {
  mediaId: string;
  externalId: string;
}

export function EpisodeTracker({ mediaId, externalId }: EpisodeTrackerProps) {
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [watched, setWatched] = useState<WatchedEpisode[]>([]);
  const [seasonRatings, setSeasonRatings] = useState<SeasonRating[]>([]);
  const [seasonEpisodes, setSeasonEpisodes] = useState<Record<number, Episode[]>>({});
  const [loading, setLoading] = useState(true);
  const [loadingEpisodes, setLoadingEpisodes] = useState<Record<number, boolean>>({});
  const [expandedSeason, setExpandedSeason] = useState<number | null>(null);

  useEffect(() => {
    const init = async () => {
      if (!mediaId || !externalId) return;
      
      setLoading(true);
      try {
        console.log('Initializing EpisodeTracker for mediaId:', mediaId);
        const [seasonsData, watchedData, ratingsData] = await Promise.all([
          fetchSeasons(externalId),
          getWatchedEpisodes(mediaId),
          getSeasonRatings(mediaId)
        ]);
        console.log('Fetched ratings:', ratingsData);
        setSeasons(seasonsData.filter(s => s.season_number > 0));
        setWatched(watchedData);
        setSeasonRatings(ratingsData);
      } catch (error) {
        console.error('Error initializing tracker:', error);
        toast.error('Failed to load episode data');
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [mediaId, externalId]);

  const loadSeasonEpisodes = async (seasonNumber: number) => {
    if (seasonEpisodes[seasonNumber] || loadingEpisodes[seasonNumber]) return;

    setLoadingEpisodes(prev => ({ ...prev, [seasonNumber]: true }));
    try {
      const episodes = await fetchSeasonEpisodes(externalId, seasonNumber);
      console.log(`Fetched ${episodes.length} episodes for season ${seasonNumber}:`, episodes);
      setSeasonEpisodes(prev => ({ ...prev, [seasonNumber]: episodes }));
    } catch (error) {
      console.error('Error loading season episodes:', error);
      toast.error(`Failed to load episodes for Season ${seasonNumber}`);
    } finally {
      setLoadingEpisodes(prev => ({ ...prev, [seasonNumber]: false }));
    }
  };

  const handleToggleSeason = (seasonNumber: number) => {
    if (expandedSeason === seasonNumber) {
      setExpandedSeason(null);
    } else {
      setExpandedSeason(seasonNumber);
      loadSeasonEpisodes(seasonNumber);
    }
  };

  const handleToggleEpisode = async (season: number, episode: number, isWatched: boolean) => {
    try {
      if (isWatched) {
        await markEpisodeWatched(mediaId, season, episode);
        setWatched(prev => [...prev, { user_id: '', media_id: mediaId, season_number: season, episode_number: episode, created_at: new Date().toISOString() }]);
      } else {
        await unmarkEpisodeWatched(mediaId, season, episode);
        setWatched(prev => prev.filter(w => !(w.season_number === season && w.episode_number === episode)));
      }
    } catch (error) {
      toast.error('Failed to update progress');
    }
  };

  const handleMarkSeasonWatched = async (season: number, episodeCount: number) => {
    try {
      await markSeasonWatched(mediaId, season, episodeCount);
      // Update local state: add all episodes of this season to watched
      setWatched(prev => {
        const otherSeasons = prev.filter(w => w.season_number !== season);
        const newWatched = Array.from({ length: episodeCount }, (_, i) => ({
          user_id: '',
          media_id: mediaId,
          season_number: season,
          episode_number: i + 1,
          created_at: new Date().toISOString()
        }));
        return [...otherSeasons, ...newWatched];
      });
      toast.success(`Season ${season} marked as watched`);
    } catch (error) {
      toast.error('Failed to update season progress');
    }
  };

  const handleRateSeason = async (seasonNumber: number, rating: number) => {
    try {
      await saveSeasonRating(mediaId, seasonNumber, rating);
      setSeasonRatings(prev => {
        const other = prev.filter(r => r.season_number !== seasonNumber);
        return [...other, { media_id: mediaId, season_number: seasonNumber, rating }];
      });
      toast.success(`Season ${seasonNumber} rated ${rating} stars`);
    } catch (error) {
      toast.error('Failed to save season rating');
    }
  };

  if (loading) return <div className="animate-pulse space-y-4">
    <div className="h-4 bg-white/5 rounded w-1/4"></div>
    <div className="h-8 bg-white/5 rounded w-full"></div>
  </div>;

  const totalProgress = getTotalProgress(watched, seasons);
  const lastWatched = getLastWatchedEpisode(watched);
  
  // Find the most recently watched episode based on created_at
  const mostRecentWatched = [...watched].sort((a, b) => {
    const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
    const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
    return dateB - dateA;
  })[0];

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="space-y-8 bg-card border border-border rounded-2xl p-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <PlayCircle className="w-5 h-5 text-primary" />
            Episode Tracking
          </h2>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">
              {lastWatched 
                ? `Last watched: Season ${lastWatched.season_number} Episode ${lastWatched.episode_number}`
                : 'No episodes watched yet'}
            </p>
            {mostRecentWatched && (
              <p className="text-xs text-muted-foreground italic">
                Last watched: {formatDate(mostRecentWatched.created_at)}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-4 min-w-[200px]">
          <div className="flex-1 space-y-1">
            <div className="flex justify-between text-xs font-medium">
              <span className="text-muted-foreground">Overall Progress</span>
              <span className="text-primary">{Math.round(totalProgress)}%</span>
            </div>
            <Progress value={totalProgress} className="h-2" />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {seasons.map((season) => {
          const progress = getSeasonProgress(watched, season.season_number, season.episode_count);
          const isFullyWatched = progress === 100;
          const currentRating = seasonRatings.find(r => r.season_number === season.season_number)?.rating || 0;
          const isExpanded = expandedSeason === season.season_number;

          return (
            <div 
              key={season.id} 
              className="border border-border rounded-xl overflow-hidden bg-white/5"
            >
              <div 
                className="flex items-center justify-between p-4 cursor-pointer hover:bg-white/5 transition-colors"
                onClick={() => handleToggleSeason(season.season_number)}
              >
                <div className="flex items-center gap-4 flex-1 text-left">
                  <div className="w-10 h-14 rounded bg-white/10 overflow-hidden flex-shrink-0">
                    {season.poster_path ? (
                      <img 
                        src={`https://image.tmdb.org/t/p/w92${season.poster_path}`} 
                        alt={season.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[10px] text-muted-foreground">S{season.season_number}</div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-foreground truncate">{season.name}</span>
                        {isFullyWatched && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                      </div>
                      <div className="flex items-center gap-1 mr-4" onClick={(e) => e.stopPropagation()}>
                        {[1, 2, 3, 4, 5].map((star) => (
                          <span
                            key={star}
                            role="button"
                            tabIndex={0}
                            onClick={() => handleRateSeason(season.season_number, star)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                handleRateSeason(season.season_number, star);
                              }
                            }}
                            className={`cursor-pointer transition-transform hover:scale-125 ${currentRating >= star ? 'text-yellow-400' : 'text-muted-foreground/30'}`}
                          >
                            <Star className={`w-3.5 h-3.5 ${currentRating >= star ? 'fill-current' : ''}`} />
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-4 mt-1">
                      <div className="flex-1 h-1.5 bg-white/10 rounded-full max-w-[100px]">
                        <div 
                          className="h-full bg-primary rounded-full transition-all duration-500" 
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-muted-foreground">{season.episode_count} Episodes</span>
                    </div>
                  </div>
                </div>
                <div className="ml-4 text-muted-foreground">
                  {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </div>
              </div>

              {isExpanded && (
                <div className="px-4 pb-4 border-t border-border/50">
                  <div className="space-y-4 pt-4">
                    <div className="flex justify-end">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleMarkSeasonWatched(season.season_number, season.episode_count)}
                        className="text-xs text-primary hover:text-primary/80 hover:bg-primary/10"
                      >
                        Mark all as watched
                      </Button>
                    </div>

                    {loadingEpisodes[season.season_number] ? (
                      <div className="flex justify-center py-4">
                        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {console.log(`Rendering episodes for season ${season.season_number}:`, seasonEpisodes[season.season_number])}
                        {seasonEpisodes[season.season_number] && seasonEpisodes[season.season_number].length > 0 ? (
                          seasonEpisodes[season.season_number].map((episode) => {
                            const isWatched = watched.some(w => 
                              w.season_number === season.season_number && 
                              w.episode_number === episode.episode_number
                            );

                            return (
                              <div 
                                key={episode.id}
                                className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors group"
                              >
                                <Checkbox 
                                  checked={isWatched}
                                  onCheckedChange={(checked) => handleToggleEpisode(season.season_number, episode.episode_number, !!checked)}
                                  id={`ep-${episode.id}`}
                                  className="border-border data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                                />
                                <label 
                                  htmlFor={`ep-${episode.id}`}
                                  className="flex-1 text-sm text-muted-foreground cursor-pointer group-hover:text-foreground transition-colors"
                                >
                                  <span className="text-muted-foreground/50 mr-2">E{episode.episode_number}</span>
                                  {episode.name}
                                </label>
                              </div>
                            );
                          })
                        ) : !loadingEpisodes[season.season_number] && seasonEpisodes[season.season_number] ? (
                          <div className="col-span-full py-4 text-center text-muted-foreground text-sm">
                            No episodes found for this season.
                          </div>
                        ) : null}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
