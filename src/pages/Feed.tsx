import React, { useEffect, useState } from 'react';
import { getFeedActivities, toggleLikeActivity, addComment, getComments } from '@/services/activityService';
import { formatDistanceToNow } from 'date-fns';
import { Heart, MessageSquare, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function Feed() {
  const [activities, setActivities] = useState<any[]>([]);
  const [expandedComment, setExpandedComment] = useState<string | null>(null);
  const [comments, setComments] = useState<Record<string, any[]>>({});
  const [commentText, setCommentText] = useState('');

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
    await toggleLikeActivity(activityId);
    setActivities(activities.map(a => a.id === activityId ? { ...a, likes: a.likes?.length > 0 ? [] : [{}] } : a)); // Optimistic toggle
  };

  const handleComment = async (activityId: string) => {
    if (!commentText.trim()) return;
    await addComment(activityId, commentText);
    setCommentText('');
    loadComments(activityId);
  };

  const loadComments = async (activityId: string) => {
    const data = await getComments(activityId);
    setComments({ ...comments, [activityId]: data.data || [] });
  };

  if (activities.length === 0) {
    return <div className="text-center text-gray-500 mt-20">Add friends to see their activity.</div>;
  }

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-4">
      <h1 className="text-2xl font-bold text-white mb-6">Activity Feed</h1>
      {activities.map(act => (
        <div key={act.id} className="bg-[#111827] p-4 rounded-xl border border-white/5 space-y-4">
          <div className="flex gap-4">
            <img src={act.profiles.avatar_url} className="w-10 h-10 rounded-full" alt="" />
            <div className="flex-1">
              <p className="text-white">
                <span className="font-bold">{act.profiles.username}</span> {act.type} {act.media?.title} {act.metadata?.rating ? `(Rated ${act.metadata.rating} ⭐)` : ''}
              </p>
              <span className="text-xs text-gray-500">{formatDistanceToNow(new Date(act.created_at))} ago</span>
              
              <div className="flex gap-4 mt-2">
                <button onClick={() => handleToggleLike(act.id)} className="flex items-center gap-1 text-gray-400 hover:text-red-500"><Heart className="w-4 h-4" /> {act.likes?.length || 0}</button>
                <button onClick={() => { setExpandedComment(expandedComment === act.id ? null : act.id); if (expandedComment !== act.id) loadComments(act.id); }} className="flex items-center gap-1 text-gray-400 hover:text-blue-500"><MessageSquare className="w-4 h-4" /> {act.comments?.length || 0}</button>
              </div>
            </div>
            {act.media?.poster_url && <img src={act.media.poster_url} className="w-16 h-24 object-cover rounded" alt="" />}
          </div>

          {expandedComment === act.id && (
            <div className="border-t border-white/10 pt-4 mt-2 space-y-4">
              {comments[act.id]?.map((c: any) => (
                <div key={c.id} className="flex gap-2">
                  <img src={c.profiles.avatar_url} className="w-6 h-6 rounded-full" alt="" />
                  <div>
                    <span className="font-bold text-sm text-white">{c.profiles.username}</span>
                    <p className="text-sm text-gray-300">{c.text}</p>
                  </div>
                </div>
              ))}
              <div className="flex gap-2">
                <Input value={commentText} onChange={(e) => setCommentText(e.target.value)} placeholder="Add a comment..." />
                <Button onClick={() => handleComment(act.id)}><Send className="w-4 h-4" /></Button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
