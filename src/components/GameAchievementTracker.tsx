import React, { useEffect, useState } from 'react';
import { Trophy as TrophyIcon } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { getSteamAchievements, SteamAchievement } from '@/services/steamService';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';

interface GameAchievementTrackerProps {
  gameName: string;
  mediaId: string;
  externalId: string;
}

interface Trophy {
  name: string;
  displayName?: string;
  description: string;
  difficulty?: string;
  platform?: string;
  percent?: number;
  icon?: string;
  icongray?: string;
}

export function GameAchievementTracker({ gameName, mediaId, externalId }: GameAchievementTrackerProps) {
  const [trophies, setTrophies] = useState<Trophy[] | null>(null);
  const [earnedTrophies, setEarnedTrophies] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAchievements = async () => {
      setLoading(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        try {
          const { data: trophiesData } = await supabase
            .from('earned_trophies')
            .select('trophy_name')
            .eq('media_id', externalId)
            .eq('user_id', user.id);
            
          if (trophiesData) {
            const trophySet = new Set<string>();
            trophiesData.forEach(t => trophySet.add(t.trophy_name));
            setEarnedTrophies(trophySet);
          }
        } catch (err) {
          console.error("earned_trophies fetch error", err);
        }
      }

      try {
        const { data: cache } = await supabase.from('game_wiki_cache').select('data').eq('media_id', externalId).eq('wiki_type', 'trophies').maybeSingle();
        if (cache && cache.data) {
          setTrophies(cache.data);
          setLoading(false);
          return;
        }
      } catch (e) { console.error('Cache load error', e); }

      // ONLY use Steam
      const data: Trophy[] = await getSteamAchievements(gameName);
      
      if (data && data.length > 0) {
        try { await supabase.from('game_wiki_cache').upsert({ media_id: externalId, wiki_type: 'trophies', data }); } catch(e){}
      }
      setTrophies(data || []);
      setLoading(false);
    };
    loadAchievements();
  }, [gameName, externalId]);

  const toggleEarnedTrophy = async (trophyName: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error('Please log in to save progress');
      return;
    }
    
    const currentlyCompleted = earnedTrophies.has(trophyName);
    const newState = !currentlyCompleted;
    
    setEarnedTrophies(prev => {
      const next = new Set(prev);
      if (newState) next.add(trophyName);
      else next.delete(trophyName);
      return next;
    });
    
    try {
      if (newState) {
        const { error } = await supabase.from('earned_trophies').upsert({
          user_id: user.id,
          media_id: externalId,
          trophy_name: trophyName,
          earned_at: new Date().toISOString()
        }, { onConflict: 'user_id,media_id,trophy_name' });
        
        if (error) {
           if (error.message.includes('does not exist')) {
             toast.error('Database configuration required', {
               description: 'Table earned_trophies is missing. Create it first.'
             });
           } else throw error;
        }
      } else {
        const { error } = await supabase.from('earned_trophies')
          .delete()
          .eq('user_id', user.id)
          .eq('media_id', externalId)
          .eq('trophy_name', trophyName);
          
        if (error) throw error;
      }
    } catch (err: any) {
      console.error(err);
      if (!err.message?.includes('does not exist')) {
        toast.error('Error saving trophy progress');
      }
      // Revert optimistic
      setEarnedTrophies(prev => {
        const next = new Set(prev);
        if (currentlyCompleted) next.add(trophyName);
        else next.delete(trophyName);
        return next;
      });
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 space-y-4 bg-card border border-border rounded-xl">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-muted-foreground">Loading achievements...</p>
      </div>
    );
  }

  if (!trophies || trophies.length === 0) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl md:text-2xl font-bold text-foreground">Achievements ({trophies.length})</h2>
      </div>

      <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
        <div className="flex justify-between items-end text-sm mb-4">
          <span className="text-muted-foreground font-medium text-base">{earnedTrophies.size} / {trophies.length} Earned</span>
          <span className="text-yellow-500 font-bold">{Math.round((earnedTrophies.size / trophies.length) * 100)}%</span>
        </div>
        <div className="h-2.5 bg-secondary rounded-full overflow-hidden">
          <div className="h-full bg-yellow-500 rounded-full transition-all duration-500 ease-out" style={{ width: `${(earnedTrophies.size / trophies.length) * 100}%` }} />
        </div>
      </div>
      
      <div className="space-y-3">
        {trophies.map((trophy, idx) => {
          const isEarned = earnedTrophies.has(trophy.name);
          
          let percentColor = "text-muted-foreground";
          if (trophy.percent !== undefined) {
            if (trophy.percent < 5) percentColor = "text-yellow-500 font-bold";
            else if (trophy.percent < 20) percentColor = "text-blue-500 font-semibold";
            else if (trophy.percent < 50) percentColor = "text-green-500 font-medium";
          }
          
          return (
            <div key={idx} className={`bg-card border ${isEarned ? 'border-yellow-500/50 bg-yellow-500/5 hover:border-yellow-500/70' : 'border-border hover:border-border/80'} rounded-xl p-4 md:p-6 flex flex-col md:flex-row md:items-center gap-4 transition-all cursor-pointer`} onClick={() => toggleEarnedTrophy(trophy.name)}>
              
              <div className="flex items-center justify-center p-2" onClick={(e) => e.stopPropagation()}>
                <Checkbox 
                  checked={isEarned} 
                  onCheckedChange={() => toggleEarnedTrophy(trophy.name)} 
                  className="w-6 h-6 border-white/20 data-[state=checked]:bg-yellow-500 data-[state=checked]:text-white data-[state=checked]:border-yellow-500" 
                />
              </div>

              <div className="w-16 h-16 rounded-xl flex items-center justify-center flex-shrink-0 bg-black/40 overflow-hidden border border-white/10 dark:border-white/5">
                {trophy.icon ? (
                  <img src={isEarned ? trophy.icon : trophy.icongray} alt={trophy.name} className="w-full h-full object-cover" />
                ) : (
                  <TrophyIcon className={`w-6 h-6 ${isEarned ? 'text-yellow-500' : 'text-gray-500'}`} />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <h3 className={`font-bold text-lg leading-tight mb-1 ${isEarned ? 'text-yellow-500' : 'text-foreground'}`}>
                  {trophy.displayName || trophy.name}
                </h3>
                <p className={`text-sm ${isEarned ? 'text-yellow-500/70' : 'text-muted-foreground'}`}>
                  {trophy.description}
                </p>
              </div>

              <div className="flex items-center gap-3 md:flex-col md:items-end">
                {trophy.percent !== undefined ? (
                  <span className={`text-sm tracking-wide ${percentColor}`}>
                    {trophy.percent.toFixed(1)}% <span className="text-muted-foreground/50 text-xs hidden sm:inline">of players</span>
                  </span>
                ) : (
                  <>
                    <span className={`text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wider ${
                      trophy.difficulty?.toLowerCase().includes('hard') ? 'bg-red-500/10 text-red-500 border border-red-500/20' :
                      trophy.difficulty?.toLowerCase().includes('easy') ? 'bg-green-500/10 text-green-500 border border-green-500/20' :
                      'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20'
                    }`}>
                      {trophy.difficulty || 'Normal'}
                    </span>
                    <span className="text-xs font-bold bg-secondary text-secondary-foreground px-3 py-1.5 rounded-full uppercase tracking-wider">
                      {trophy.platform || 'Both'}
                    </span>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
