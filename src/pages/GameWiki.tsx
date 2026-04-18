import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, BookOpen, ChevronDown, ChevronUp, Swords, Trophy as TrophyIcon, Shield, Sparkles, Map } from 'lucide-react';
import { fetchMediaDetails, MediaItem } from '@/services/api';
import { getGameMainMissions, getGameSideMissions, getGameTipsAndClasses } from '@/services/aiService';
import { supabase } from '@/lib/supabase';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';

interface Mission {
  id: number;
  title: string;
  description: string;
  rewards?: string;
  tips?: string;
  completed?: boolean;
}

interface Tip {
  category: string;
  title: string;
  description: string;
}

interface Class {
  name: string;
  description: string;
  pros: string;
  cons: string;
}

export function GameWiki() {
  const { id } = useParams();
  const [game, setGame] = useState<MediaItem | null>(null);
  
  const [activeTab, setActiveTab] = useState('main');
  const [completedQuests, setCompletedQuests] = useState<Set<string>>(new Set());

  const [mainMissions, setMainMissions] = useState<Mission[] | null>(null);
  const [loadingMain, setLoadingMain] = useState(false);

  const [sideMissions, setSideMissions] = useState<Mission[] | null>(null);
  const [loadingSide, setLoadingSide] = useState(false);

  const [tipsAndClasses, setTipsAndClasses] = useState<{tips: Tip[], classes: Class[]} | null>(null);
  const [loadingTips, setLoadingTips] = useState(false);

  const [expandedMissions, setExpandedMissions] = useState<Set<string>>(new Set());
  const [initialLoading, setInitialLoading] = useState(true);

  // Fetch Game Details and Completed Quests once
  useEffect(() => {
    const loadGameAndProgress = async () => {
      if (!id) return;
      setInitialLoading(true);
      
      try {
        const gameData = await fetchMediaDetails(id, 'game');
        setGame(gameData);
        
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          try {
            const { data: quests } = await supabase
              .from('game_quests')
              .select('quest_id, is_side_mission')
              .eq('media_id', id)
              .eq('completed', true)
              .eq('user_id', user.id);
              
            if (quests) {
              const completedSet = new Set<string>();
              quests.forEach(q => {
                completedSet.add(`${q.is_side_mission ? 'side' : 'main'}-${q.quest_id}`);
              });
              setCompletedQuests(completedSet);
            }
          } catch (e) {
            console.error("game_quests fetch error", e);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setInitialLoading(false);
      }
    };
    
    loadGameAndProgress();
  }, [id]);

  // Lazy load tab content based on activeTab
  useEffect(() => {
    if (!game || initialLoading || !id) return;

    if (activeTab === 'main' && mainMissions === null && !loadingMain) {
      setLoadingMain(true);
      const tryLoad = async () => {
        try {
          const { data: cache } = await supabase.from('game_wiki_cache').select('data').eq('media_id', id).eq('wiki_type', 'main').maybeSingle();
          if (cache && cache.data) {
            setMainMissions(cache.data.map((m: any) => ({ ...m, completed: completedQuests.has(`main-${m.id}`) })));
            return;
          }
        } catch (e) { console.error('Cache load error', e); }

        getGameMainMissions(game.title).then(async data => {
          if (data) {
            try { await supabase.from('game_wiki_cache').upsert({ media_id: id, wiki_type: 'main', data }); } catch(e){}
            setMainMissions(data.map((m: any) => ({ ...m, completed: completedQuests.has(`main-${m.id}`) })));
          } else {
            setMainMissions([]);
          }
        }).catch(() => setMainMissions([]))
        .finally(() => setLoadingMain(false));
      };
      tryLoad();
    }

    if (activeTab === 'side' && sideMissions === null && !loadingSide) {
      setLoadingSide(true);
      const tryLoad = async () => {
        try {
          const { data: cache } = await supabase.from('game_wiki_cache').select('data').eq('media_id', id).eq('wiki_type', 'side').maybeSingle();
          if (cache && cache.data) {
            setSideMissions(cache.data.map((m: any) => ({ ...m, completed: completedQuests.has(`side-${m.id}`) })));
            return;
          }
        } catch (e) { console.error('Cache load error', e); }

        getGameSideMissions(game.title).then(async data => {
          if (data) {
            try { await supabase.from('game_wiki_cache').upsert({ media_id: id, wiki_type: 'side', data }); } catch(e){}
            setSideMissions(data.map((m: any) => ({ ...m, completed: completedQuests.has(`side-${m.id}`) })));
          } else {
            setSideMissions([]);
          }
        }).catch(() => setSideMissions([]))
        .finally(() => setLoadingSide(false));
      };
      tryLoad();
    }

    if (activeTab === 'tips' && tipsAndClasses === null && !loadingTips) {
      setLoadingTips(true);
      const tryLoad = async () => {
        try {
          const { data: cache } = await supabase.from('game_wiki_cache').select('data').eq('media_id', id).eq('wiki_type', 'tips').maybeSingle();
          if (cache && cache.data) {
            setTipsAndClasses(cache.data);
            return;
          }
        } catch (e) { console.error('Cache load error', e); }

        getGameTipsAndClasses(game.title).then(async data => {
          if (data) {
            try { await supabase.from('game_wiki_cache').upsert({ media_id: id, wiki_type: 'tips', data }); } catch(e){}
          }
          setTipsAndClasses(data || { tips: [], classes: [] });
        }).catch(() => setTipsAndClasses({ tips: [], classes: [] }))
        .finally(() => setLoadingTips(false));
      };
      tryLoad();
    }
  }, [activeTab, game, initialLoading, completedQuests, id]);

  const toggleExpand = (missionKey: string) => {
    setExpandedMissions(prev => {
      const next = new Set(prev);
      if (next.has(missionKey)) next.delete(missionKey);
      else next.add(missionKey);
      return next;
    });
  };

  const toggleCompletion = async (missionId: number, isSide: boolean, currentlyCompleted: boolean) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !id) {
      toast.error('Please log in to save progress');
      return;
    }
    
    const newState = !currentlyCompleted;
    
    // Optimistic UI update
    if (isSide) {
      setSideMissions(prev => prev ? prev.map(m => m.id === missionId ? { ...m, completed: newState } : m) : null);
    } else {
      setMainMissions(prev => prev ? prev.map(m => m.id === missionId ? { ...m, completed: newState } : m) : null);
    }

    // Update the set internally directly
    setCompletedQuests(prev => {
      const next = new Set(prev);
      const key = `${isSide ? 'side' : 'main'}-${missionId}`;
      if (newState) next.add(key);
      else next.delete(key);
      return next;
    });
    
    try {
      if (newState) {
        const { error } = await supabase.from('game_quests').upsert({
          user_id: user.id,
          media_id: id,
          quest_id: missionId,
          is_side_mission: isSide,
          completed: true,
          status: 'completed'
        });
        if (error) {
          if (error.message.includes('is_side_mission')) {
            toast.error('Database configuration required', {
              description: 'Please run SQL: ALTER TABLE game_quests ADD COLUMN is_side_mission BOOLEAN DEFAULT false;'
            });
          } else {
            throw error;
          }
        }
      } else {
        const { error } = await supabase.from('game_quests')
          .delete()
          .eq('user_id', user.id)
          .eq('media_id', id)
          .eq('quest_id', missionId)
          .eq('is_side_mission', !!isSide);
          
        if (error) throw error;
      }
    } catch (err: any) {
      console.error(err);
      if (!err.message?.includes('is_side_mission')) {
        toast.error('Error saving progress');
      }
      // Revert optimistic update
      if (isSide) {
        setSideMissions(prev => prev ? prev.map(m => m.id === missionId ? { ...m, completed: currentlyCompleted } : m) : null);
      } else {
        setMainMissions(prev => prev ? prev.map(m => m.id === missionId ? { ...m, completed: currentlyCompleted } : m) : null);
      }
    }
  };

  const renderMissions = (missions: Mission[] | null, isSide: boolean, isLoading: boolean) => {
    if (isLoading) {
       return (
         <div className="p-8 flex flex-col items-center justify-center h-[40vh] space-y-4">
           <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
           <p className="text-gray-400">Loading missions with AI...</p>
         </div>
       );
    }
    
    if (!missions || missions.length === 0) return <div className="text-gray-400 my-8 text-center p-8 bg-white/5 rounded-xl border border-white/10">No missions found.</div>;
    
    const completedCount = missions.filter(m => m.completed).length;
    const progressPercent = missions.length > 0 ? (completedCount / missions.length) * 100 : 0;
    
    return (
      <div className="space-y-6 mt-4">
        <div className="bg-[#111827] border border-white/5 rounded-xl p-6 shadow-xl">
          <div className="flex justify-between items-end text-sm mb-4">
            <span className="text-gray-300 font-medium text-base">{completedCount} / {missions.length} Missions Completed</span>
            <span className="text-blue-400 font-bold">{Math.round(progressPercent)}%</span>
          </div>
          <div className="h-2.5 bg-gray-800 rounded-full overflow-hidden">
            <div className="h-full bg-blue-500 rounded-full transition-all duration-500 ease-out" style={{ width: `${progressPercent}%` }} />
          </div>
        </div>
        
        <div className="space-y-3">
          {missions.map(mission => {
            const missionKey = `${isSide ? 'side' : 'main'}-${mission.id}`;
            const isExpanded = expandedMissions.has(missionKey);
            
            return (
              <div key={missionKey} className="bg-[#111827] border border-white/10 rounded-xl overflow-hidden transition-all hover:border-white/20">
                <div className="flex items-center gap-4 p-4 md:p-5 hover:bg-white/[0.02] cursor-pointer" onClick={() => toggleExpand(missionKey)}>
                  <div onClick={(e) => e.stopPropagation()}>
                    <Checkbox 
                      checked={mission.completed} 
                      onCheckedChange={() => toggleCompletion(mission.id, isSide, !!mission.completed)}
                      className="w-5 h-5 md:w-6 md:h-6 rounded-md border-white/30"
                    />
                  </div>
                  <div className={`flex-1 font-semibold text-sm md:text-base select-none transition-colors ${mission.completed ? 'text-gray-500 line-through' : 'text-white'}`}>
                    {mission.title || `Mission ${mission.id}`}
                  </div>
                  <button className="text-gray-400 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors">
                    {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                  </button>
                </div>
                
                {isExpanded && (
                  <div className="p-4 md:p-6 pt-0 border-t border-white/10 bg-[#0a0f1e]/50">
                    <p className="text-gray-300 text-sm mt-4 mb-6 leading-relaxed bg-[#111827] p-4 rounded-lg border border-white/5">
                      {mission.description || 'No description available.'}
                    </p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {mission.rewards && (
                        <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4">
                          <h4 className="text-green-400 text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5">
                            <Sparkles className="w-4 h-4" /> Rewards
                          </h4>
                          <p className="text-green-200/90 text-sm font-medium">{mission.rewards}</p>
                        </div>
                      )}
                      {mission.tips && (
                        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
                          <h4 className="text-blue-400 text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5">
                            <BookOpen className="w-4 h-4" /> Strategy Tips
                          </h4>
                          <p className="text-blue-200/90 text-sm leading-relaxed">{mission.tips}</p>
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
  };

  if (initialLoading) {
    return (
      <div className="p-8 flex flex-col items-center justify-center h-[60vh] space-y-6">
         <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!game) return <div className="p-8 text-white flex justify-center items-center h-[50vh]"><p className="bg-[#111827] p-6 rounded-xl border border-white/10">Game details not found.</p></div>;

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-300 ease-in-out">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Link to={`/content/${id}`} className="w-10 h-10 flex items-center justify-center rounded-full bg-[#111827] border border-white/10 hover:bg-white/10 text-gray-400 hover:text-white transition-all">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex flex-col">
            <h1 className="text-2xl md:text-4xl font-black text-white flex items-center gap-3">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
                {game.title}
              </span>
              <span className="text-white font-bold">Wiki</span>
            </h1>
            <p className="text-gray-400 text-sm mt-1">Complete game guide, missions, and strategies.</p>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-[#111827] border border-white/10 mb-8 flex flex-wrap h-auto p-1 rounded-xl">
          <TabsTrigger value="main" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white flex-1 min-w-[140px] text-sm py-2.5 rounded-lg transition-all">
            <Shield className="w-4 h-4 mr-2" /> Main Missions
          </TabsTrigger>
          <TabsTrigger value="side" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white flex-1 min-w-[140px] text-sm py-2.5 rounded-lg transition-all">
            <Map className="w-4 h-4 mr-2" /> Side Missions
          </TabsTrigger>
          <TabsTrigger value="tips" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white flex-1 min-w-[140px] text-sm py-2.5 rounded-lg transition-all">
            <BookOpen className="w-4 h-4 mr-2" /> Tips & Builds
          </TabsTrigger>
        </TabsList>

        <TabsContent value="main" className="min-h-[500px]">
          {renderMissions(mainMissions, false, loadingMain)}
        </TabsContent>
        
        <TabsContent value="side" className="min-h-[500px]">
          {renderMissions(sideMissions, true, loadingSide)}
        </TabsContent>

        <TabsContent value="tips" className="min-h-[500px] mt-4 space-y-8">
          {loadingTips ? (
            <div className="flex flex-col items-center justify-center p-12 space-y-4">
              <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-gray-400">Loading tips and builds with AI...</p>
            </div>
          ) : (
            <>
              {/* Game Tips Section */}
              <section>
                <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                  <BookOpen className="w-6 h-6 text-blue-400" />
                  General Tips & Strategies
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {tipsAndClasses?.tips?.map((tip, idx) => (
                    <div key={idx} className="bg-[#111827] border border-white/5 rounded-xl p-6 hover:border-white/20 transition-all flex flex-col h-full">
                      <span className="text-xs font-bold uppercase tracking-widest text-purple-400 mb-2">{tip.category}</span>
                      <h3 className="text-lg font-bold text-white mb-3">{tip.title}</h3>
                      <p className="text-gray-300 text-sm leading-relaxed max-w-prose">{tip.description}</p>
                    </div>
                  ))}
                  {(!tipsAndClasses?.tips || tipsAndClasses.tips.length === 0) && (
                    <div className="col-span-full text-center text-gray-400 p-8">No tips available.</div>
                  )}
                </div>
              </section>

              {/* Classes & Builds Section */}
              <section>
                <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                  <Swords className="w-6 h-6 text-purple-400" />
                  Best Classes & Builds
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {tipsAndClasses?.classes?.map((cls, idx) => (
                    <div key={idx} className="bg-[#111827] border border-white/5 rounded-xl overflow-hidden hover:border-white/20 transition-all flex flex-col">
                      <div className="bg-gradient-to-r from-blue-900/40 to-indigo-900/40 p-6 border-b border-white/5">
                        <h3 className="text-xl font-bold text-white flex items-center gap-2">
                          <Swords className="w-5 h-5 text-blue-400" />
                          {cls.name}
                        </h3>
                      </div>
                      <div className="p-6 flex flex-col flex-1 gap-4">
                        <p className="text-gray-300 text-sm leading-relaxed">{cls.description}</p>
                        
                        <div className="mt-auto space-y-4 pt-4 border-t border-white/5">
                          <div>
                            <h4 className="text-green-400 text-xs font-bold uppercase tracking-wider mb-2">Strengths</h4>
                            <p className="text-gray-300 text-sm bg-green-500/5 p-3 rounded-lg border border-green-500/10">{cls.pros}</p>
                          </div>
                          <div>
                            <h4 className="text-red-400 text-xs font-bold uppercase tracking-wider mb-2">Weaknesses</h4>
                            <p className="text-gray-300 text-sm bg-red-500/5 p-3 rounded-lg border border-red-500/10">{cls.cons}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  {(!tipsAndClasses?.classes || tipsAndClasses.classes.length === 0) && (
                    <div className="col-span-full text-center text-gray-400 p-8">No classes available.</div>
                  )}
                </div>
              </section>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
