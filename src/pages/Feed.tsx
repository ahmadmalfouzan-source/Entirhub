import React, { useEffect, useState } from 'react';
import { getFeedActivities, toggleLike, addComment, getComments, deleteComment } from '@/services/activityService';
import { formatDistanceToNow } from 'date-fns';
import { Heart, MessageSquare, Send, Trash2, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useStore } from '@/store/useStore';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';

export function Feed() {
  const [activities, setActivities] = useState<any[]>([]);
  const navigate = useNavigate();
  const [expandedComment, setExpandedComment] = useState<string | null>(null);
  const [comments, setComments] = useState<Record<string, any[]>>({});
  const [commentText, setCommentText] = useState('');
  const { user } = useStore();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const data = await getFeedActivities();
      setActivities(data || []);
    } catch (error) {
      console.error('Error loading feed:', error);
      setActivities([]);
    }
  };

  const handleToggleLike = async (activityId: string) => {
    if (!user) return;
    
    // Optimistic UI update
    setActivities(prev => prev.map(a => {
      if (a.id === activityId) {
        const isLiked = a.activity_likes?.some((l: any) => l.user_id === user.id);
        const newLikes = isLiked 
          ? a.activity_likes.filter((l: any) => l.user_id !== user.id)
          : [...(a.activity_likes || []), { user_id: user.id }];
        return { ...a, activity_likes: newLikes };
      }
      return a;
    }));

    await toggleLike(activityId);
  };

  const handleComment = async (activityId: string) => {
    if (!commentText.trim()) return;
    await addComment(activityId, commentText);
    setCommentText('');
    
    // Update count
    setActivities(prev => prev.map(a => 
      a.id === activityId 
        ? { ...a, activity_comments: [...(a.activity_comments || []), { id: 'temp' }] } 
        : a
    ));
    
    loadComments(activityId);
  };

  const handleDeleteComment = async (activityId: string, commentId: string) => {
    await deleteComment(commentId);
    
    // Update count
    setActivities(prev => prev.map(a => 
      a.id === activityId 
        ? { ...a, activity_comments: (a.activity_comments || []).slice(0, -1) } 
        : a
    ));
    
    loadComments(activityId);
  };

  const loadComments = async (activityId: string) => {
    const data = await getComments(activityId);
    setComments({ ...comments, [activityId]: data.data || [] });
  };

  if (activities.length === 0) {
    return (
      <div className="flex flex-col min-h-[80vh] items-center justify-center p-6 text-center animate-in fade-in duration-700">
         <div className="relative p-12 max-w-sm w-full text-center border-2 border-dashed border-white/10 rounded-[32px] flex flex-col items-center justify-center bg-white/[0.02] overflow-hidden group">
           
           {/* Animated Background Grid for Empty State */}
           <div className="absolute inset-0 z-0 opacity-0 group-hover:opacity-100 transition-opacity duration-1000">
             <div className="absolute inset-0" style={{
               backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.15) 1px, transparent 0)',
               backgroundSize: '24px 24px',
               animation: 'pulse-grid 4s infinite alternate'
             }} />
             <div className="absolute inset-0 bg-gradient-to-t from-[#030308] to-transparent" />
             <style>{`
               @keyframes pulse-grid {
                 0% { opacity: 0.1; transform: scale(1); }
                 100% { opacity: 0.4; transform: scale(1.05); }
               }
             `}</style>
           </div>

           <div className="relative z-10 w-24 h-24 rounded-[40px] bg-gradient-to-br from-primary/20 to-accent/20 border border-white/5 flex items-center justify-center mb-6 shadow-2xl">
             <Users className="w-10 h-10 text-primary opacity-80" />
           </div>
           <h2 className="relative z-10 text-2xl font-black text-white italic tracking-tighter uppercase leading-tight mb-3">
             NO ACTIVITY DETECTED<span className="text-primary">.</span>
           </h2>
           <p className="relative z-10 text-xs font-bold text-gray-500 uppercase tracking-[0.2em] max-w-[280px] leading-relaxed mx-auto mb-8">
             Your network is silent. Add friends to synchronize your feeds and discover what they are experiencing.
           </p>
           <Button variant="outline" className="relative z-10 rounded-3xl border-white/10 hover:bg-white/5 px-8 h-12 text-xs font-black tracking-widest uppercase" onClick={() => navigate('/friends')}>
             FIND CONNECTIONS
           </Button>
         </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-4">
      <h1 className="text-2xl font-bold text-white mb-6">Activity Feed</h1>
      {activities.map(act => (
        <div key={act.id} className="premium-card p-4 rounded-2xl border border-white/5 space-y-4 shadow-[var(--shadow-bento)]">
          <div className="flex gap-4">
            <img 
              src={act.profiles.avatar_url} 
              className="w-10 h-10 rounded-xl cursor-pointer hover:ring-2 hover:ring-primary transition-all" 
              alt="" 
              onClick={() => navigate(`/user/${act.profiles.username}`)}
            />
            <div className="flex-1">
              <p className="text-white">
                <span 
                  className="font-bold cursor-pointer hover:text-primary transition-colors"
                  onClick={() => navigate(`/user/${act.profiles.username}`)}
                >
                  {act.profiles.username}
                </span> {act.type === 'reviewed' ? 'reviewed' : act.type} <span 
                  className="font-black italic cursor-pointer hover:text-primary transition-colors"
                  onClick={() => navigate(`/content/${act.media?.external_id || act.media_id}`)}
                >
                  {act.media?.title}
                </span> {act.metadata?.rating ? `⭐${act.metadata.rating}/10` : ''}
              </p>
              <span className="text-xs text-gray-500">{formatDistanceToNow(new Date(act.created_at))} ago</span>
              
              <div className="flex gap-4 mt-2">
                <button 
                  onClick={() => handleToggleLike(act.id)} 
                  className={`flex items-center gap-1.5 transition-colors duration-200 ${
                    user && act.activity_likes?.some((l: any) => l.user_id === user.id) 
                      ? 'text-red-500' 
                      : 'text-gray-400 hover:text-red-400'
                  }`}
                >
                  <motion.div
                    whileTap={{ scale: 1.4 }}
                    transition={{ type: "spring", stiffness: 400, damping: 10 }}
                  >
                    {user && act.activity_likes?.some((l: any) => l.user_id === user.id) ? (
                      <Heart className="w-4 h-4 fill-current" />
                    ) : (
                      <Heart className="w-4 h-4" />
                    )}
                  </motion.div>
                  <span className="text-sm font-medium">{act.activity_likes?.length || 0}</span>
                </button>
                <button onClick={() => { setExpandedComment(expandedComment === act.id ? null : act.id); if (expandedComment !== act.id) loadComments(act.id); }} className="flex items-center gap-1.5 text-gray-400 hover:text-blue-500 transition-colors">
                  <MessageSquare className="w-4 h-4" /> 
                  <span className="text-sm font-medium">{act.activity_comments?.length || 0}</span>
                </button>
              </div>
            </div>
            {act.media?.poster_url && <img src={act.media.poster_url} className="w-16 h-24 object-cover rounded" alt="" />}
          </div>

          {expandedComment === act.id && (
            <div className="border-t border-white/10 pt-4 mt-2 space-y-4">
              <div className="space-y-4 max-h-60 overflow-y-auto pr-2 no-scrollbar">
                {comments[act.id]?.map((c: any) => (
                  <div key={c.id} className="flex gap-2 group">
                    <img src={c.profiles.avatar_url} className="w-8 h-8 rounded-xl flex-shrink-0" alt="" />
                    <div className="flex-1 premium-glass border-x-0 border-t-0 rounded-2xl px-4 py-2 relative shadow-md">
                      <div className="flex justify-between items-start">
                        <span className="font-bold text-sm text-white">{c.profiles.username}</span>
                        <span className="text-[10px] text-gray-500">{formatDistanceToNow(new Date(c.created_at))} ago</span>
                      </div>
                      <p className="text-sm text-gray-300 pr-6">{c.text}</p>
                      
                      {user && c.user_id === user.id && (
                        <button 
                          onClick={() => handleDeleteComment(act.id, c.id)}
                          className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity text-gray-500 hover:text-red-500"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <Input 
                  value={commentText} 
                  onChange={(e) => setCommentText(e.target.value)} 
                  placeholder="Add a comment..." 
                  className="bg-white/5 border-white/10"
                  onKeyDown={(e) => e.key === 'Enter' && handleComment(act.id)}
                />
                <Button variant="ghost" className="hover:bg-blue-500/20 text-accent" onClick={() => handleComment(act.id)}><Send className="w-4 h-4" /></Button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
