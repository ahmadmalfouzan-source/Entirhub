import { supabase } from '@/lib/supabase';

export interface UserProfile {
  id: string;
  username: string;
  avatar_url: string;
}

export interface Friendship {
  id: string;
  sender_id: string;
  receiver_id: string;
  status: 'pending' | 'accepted' | 'rejected';
  sender: UserProfile;
  receiver: UserProfile;
}

export const sendFriendRequest = async (receiverUsername: string) => {
  const { data: userData, error: userError } = await supabase
    .from('profiles')
    .select('id')
    .eq('username', receiverUsername)
    .single();

  if (userError || !userData) throw new Error('User not found');

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  return await supabase.from('friendships').insert({
    sender_id: user.id,
    receiver_id: userData.id,
    status: 'pending'
  });
};

export const acceptFriendRequest = async (friendshipId: string) => {
  return await supabase
    .from('friendships')
    .update({ status: 'accepted' })
    .eq('id', friendshipId);
};

export const rejectFriendRequest = async (friendshipId: string) => {
  return await supabase
    .from('friendships')
    .update({ status: 'rejected' })
    .eq('id', friendshipId);
};

export const getFriends = async (): Promise<Friendship[]> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('friendships')
    .select(`
      id,
      sender:profiles!sender_id(id, username, avatar_url),
      receiver:profiles!receiver_id(id, username, avatar_url)
    `)
    .eq('status', 'accepted')
    .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`);

  if (error) throw error;
  return data as any;
};

export const getPendingRequests = async (): Promise<Friendship[]> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('friendships')
    .select(`
      id,
      sender_id,
      receiver_id,
      status,
      sender:profiles!sender_id(id, username, avatar_url),
      receiver:profiles!receiver_id(id, username, avatar_url)
    `)
    .eq('status', 'pending')
    .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`);

  if (error) throw error;
  return data as any;
};

export const removeFriend = async (friendshipId: string) => {
  return await supabase
    .from('friendships')
    .delete()
    .eq('id', friendshipId);
};
