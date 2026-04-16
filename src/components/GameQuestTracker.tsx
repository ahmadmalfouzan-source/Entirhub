import React, { useEffect, useState } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/lib/supabase';
import { getGameMissions } from '@/services/aiService';
import { toast } from 'sonner';

interface Quest {
  id: number;
  title: string;
  description: string;
  type: string;
  completed?: boolean;
}

interface GameQuestTrackerProps {
  gameName: string;
  mediaId: string;
}

export function GameQuestTracker({ gameName, mediaId }: GameQuestTrackerProps) {
  const [quests, setQuests] = useState<Quest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadQuests = async () => {
      setLoading(true);
      setError(null);
      console.log('Fetching progress for mediaId:', mediaId);
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError) throw userError;
        if (!user) return;

        // 1. Fetch from game_progress
        console.log('Fetching game_progress...');
        const { data: progressData, error: progressError } = await supabase
          .from('game_progress')
          .select('*')
          .eq('media_id', mediaId)
          .eq('user_id', user.id);
        
        if (progressError) {
          console.error('Error fetching game_progress:', progressError);
          throw progressError;
        }
        console.log('Fetched rows count from game_progress:', progressData?.length);

        // 2. Fetch from Gemini
        console.log('Fetching missions from Gemini...');
        const missions = await getGameMissions(gameName);
        console.log('Fetched missions:', missions);
        
        // 3. Fetch completed from Supabase
        console.log('Fetching game_quests...');
        const { data: completedQuests, error: questsError } = await supabase
          .from('game_quests')
          .select('quest_id')
          .eq('media_id', mediaId)
          .eq('completed', true);

        if (questsError) {
          console.error('Error fetching game_quests:', questsError);
          throw questsError;
        }
        console.log('Fetched completed quests:', completedQuests?.length);

        // 4. If no progress exists, create default progress
        if (!progressData || progressData.length === 0) {
          console.log('No progress found, initializing...');
          await supabase.from('game_progress').insert({
            user_id: user.id,
            media_id: mediaId,
            progress_percent: 0,
            hours_played: 0,
            last_played: new Date().toISOString()
          });
          
          // Insert default missions
          const defaultMissions = ['Prologue', 'Franklin and Lamar', 'Complications'];
          const missionsToInsert = defaultMissions.map(title => ({
            user_id: user.id,
            media_id: mediaId,
            title: title,
            status: 'pending'
          }));
          
          await supabase.from('game_quests').insert(missionsToInsert);
          
          // Update state directly
          setQuests(missionsToInsert.map(m => ({ ...m, id: Math.random(), completed: false })));
          return;
        }

        const completedIds = new Set(completedQuests?.map(q => q.quest_id) || []);
        
        setQuests(missions.map(m => ({ ...m, completed: completedIds.has(m.id) })));
      } catch (error: any) {
        console.error('Error loading quests:', error);
        if (error.message && error.message.includes('Invalid Refresh Token')) {
          await supabase.auth.signOut();
          window.location.reload();
        }
        setError(error.message || 'Failed to load quest tracker');
        toast.error('Failed to load quest tracker');
      } finally {
        setLoading(false);
      }
    };
    loadQuests();
  }, [gameName, mediaId]);

  const handleToggleQuest = async (questId: number, completed: boolean) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      if (completed) {
        await supabase.from('game_quests').upsert({
          user_id: user.id,
          media_id: mediaId,
          quest_id: questId,
          completed: true
        });
      } else {
        await supabase.from('game_quests')
          .delete()
          .eq('user_id', user.id)
          .eq('media_id', mediaId)
          .eq('quest_id', questId);
      }

      setQuests(prev => prev.map(q => q.id === questId ? { ...q, completed } : q));
    } catch (error) {
      toast.error('Failed to update quest');
    }
  };

  const completedCount = quests.filter(q => q.completed).length;
  const progress = quests.length > 0 ? (completedCount / quests.length) * 100 : 0;

  return (
    <div className="bg-card border border-border rounded-xl p-6 space-y-4">
      <h3 className="text-lg font-bold text-foreground">Story Progress</h3>
      {loading ? (
        <div className="animate-pulse p-4 bg-card rounded-xl">Loading quests...</div>
      ) : error ? (
        <div className="p-4 bg-destructive/10 text-destructive rounded-xl text-sm">
          Error: {error}
        </div>
      ) : (
        <>
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{completedCount} / {quests.length} Completed</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} />
          </div>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {quests.length > 0 ? (
              quests.map(quest => (
                <div key={quest.id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-white/5">
                  <Checkbox 
                    checked={quest.completed}
                    onCheckedChange={(checked) => handleToggleQuest(quest.id, !!checked)}
                  />
                  <div>
                    <p className={`text-sm font-medium ${quest.completed ? 'text-muted-foreground line-through' : 'text-foreground'}`}>
                      {quest.title}
                    </p>
                    <p className="text-xs text-muted-foreground">{quest.description}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No missions found.</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
