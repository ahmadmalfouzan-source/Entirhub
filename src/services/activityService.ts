import { supabase } from '@/lib/supabase';

export type ActivityType = 'added' | 'completed' | 'started' | 'dropped' | 'rated' | 'reviewed';

export const logActivity = async (type: ActivityType, mediaId: string, metadata: any = {}) => {
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;
  if (!user) return;

  return await supabase.from('activity_feed').insert({
    user_id: user.id,
    type,
    media_id: mediaId,
    metadata
  });
};

export const getFeedActivities = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;
  if (!user) return [];

  const { data: friends } = await supabase
    .from('friendships')
    .select('sender_id, receiver_id')
    .eq('status', 'accepted')
    .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`);

  const friendIds = friends?.map(f => f.sender_id === user.id ? f.receiver_id : f.sender_id) || [];
  const userIds = [user.id, ...friendIds];

  const { data, error } = await supabase
    .from('activity_feed')
    .select(`
      *,
      profiles:user_id(id, username, avatar_url),
      media:media_id(title, poster_url),
      activity_likes(user_id),
      activity_comments(id)
    `)
    .in('user_id', userIds)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching feed activities:', error);
    return [];
  }
  
  return data;
};

export const toggleLike = async (activityId: string) => {
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;
  if (!user) return;

  const { data: existing } = await supabase
    .from('activity_likes')
    .select('id')
    .eq('activity_id', activityId)
    .eq('user_id', user.id)
    .maybeSingle();

  if (existing) {
    return await supabase.from('activity_likes').delete().eq('id', existing.id);
  } else {
    const res = await supabase.from('activity_likes').insert({ activity_id: activityId, user_id: user.id });
    
    // Notification
    try {
      const { data: activity } = await supabase
        .from('activity_feed')
        .select('user_id, media:media_id(title)')
        .eq('id', activityId)
        .single();
        
      if (activity && activity.user_id !== user.id) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('username')
          .eq('id', user.id)
          .single();

        await supabase.from('notifications').insert({
          user_id: activity.user_id,
          title: 'Activity Like',
          message: `${profile?.username || 'Ahmad'} liked your activity`,
        });
      }
    } catch (e) {
      console.warn('Notification failed', e);
    }
    return res;
  }
};

export const getLikesData = async (activityId: string) => {
  const { data: { session } } = await supabase.auth.getSession();
  const userId = session?.user?.id;

  const { data: likes, count, error } = await supabase
    .from('activity_likes')
    .select('user_id', { count: 'exact' })
    .eq('activity_id', activityId);

  if (error) return { count: 0, isLiked: false };

  const isLiked = userId ? likes?.some(l => l.user_id === userId) : false;
  return { count: count || 0, isLiked };
};

export const addComment = async (activityId: string, text: string) => {
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;
  if (!user) return;
  
  const res = await supabase.from('activity_comments').insert({ activity_id: activityId, user_id: user.id, text });
  
  // Notification
  try {
    const { data: activity } = await supabase
      .from('activity_feed')
      .select('user_id')
      .eq('id', activityId)
      .single();
      
    if (activity && activity.user_id !== user.id) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', user.id)
        .single();

      await supabase.from('notifications').insert({
        user_id: activity.user_id,
        title: 'New Comment',
        message: `${profile?.username || 'Ahmad'} commented on your activity`,
      });
    }
  } catch (e) {
    console.warn('Comment notification failed', e);
  }
  
  return res;
};

export const deleteComment = async (commentId: string) => {
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;
  if (!user) return;
  
  return await supabase
    .from('activity_comments')
    .delete()
    .eq('id', commentId)
    .eq('user_id', user.id);
};

export const getComments = async (activityId: string) => {
  return await supabase
    .from('activity_comments')
    .select('*, profiles:user_id(username, avatar_url)')
    .eq('activity_id', activityId)
    .order('created_at', { ascending: true });
};

export const getUserActivities = async (userId: string) => {
  const { data, error } = await supabase
    .from('activity_feed')
    .select('*, profiles:user_id(username, avatar_url)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching user activities:', error);
    return [];
  }
  return data;
};

export const deleteActivity = async (id: string) => {
  return await supabase.from('activity_feed').delete().eq('id', id);
};
