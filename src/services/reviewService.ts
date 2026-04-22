import { supabase } from '@/lib/supabase';
import { ensureMediaExists } from './library';
import { fetchMediaDetails } from './api';

export interface Review {
  id: string;
  user_id: string;
  media_id: string;
  content: string;
  rating: number;
  contains_spoilers: boolean;
  created_at: string;
  updated_at: string;
  profiles?: {
    username: string;
    avatar_url: string;
  };
  likes_count?: number;
  is_liked?: boolean;
  is_verified?: boolean;
}

export const createReview = async (
  mediaId: string,
  content: string,
  rating: number,
  containsSpoilers: boolean
) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Authentication required');

  // Ensure media exists and get UUID
  const type = mediaId.includes('_game_') ? 'game' : 
               mediaId.includes('_series_') ? 'series' : 'movie';
  const details = await fetchMediaDetails(mediaId, type as any);
  if (!details) throw new Error('Could not resolve media details for review');

  const uuidMediaId = await ensureMediaExists({
    external_id: mediaId,
    media_type: type as any,
    title: details.title,
    poster_url: details.poster_url,
    rating_global: details.rating,
    release_date: details.release_date,
    genres: details.genres,
    source: mediaId.startsWith('rawg_') ? 'rawg' : 'tmdb'
  });

  return await supabase.from('reviews').insert({
    user_id: user.id,
    media_id: uuidMediaId,
    content,
    rating,
    contains_spoilers: containsSpoilers,
  }).select().single();
};

export const updateReview = async (
  reviewId: string,
  content: string,
  rating: number,
  containsSpoilers: boolean
) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Authentication required');

  return await supabase.from('reviews').update({
    content,
    rating,
    contains_spoilers: containsSpoilers,
    updated_at: new Date().toISOString(),
  }).eq('id', reviewId).eq('user_id', user.id).select().single();
};

export const deleteReview = async (reviewId: string) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Authentication required');

  return await supabase.from('reviews').delete().eq('id', reviewId).eq('user_id', user.id);
};

export const getMediaReviews = async (mediaId: string): Promise<Review[]> => {
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;
  
  const { data: reviewsData, error: reviewsError } = await supabase
    .from('reviews')
    .select(`
      *,
      profiles:user_id(username, avatar_url),
      review_likes(user_id),
      media!inner(external_id)
    `)
    .eq('media.external_id', mediaId)
    .order('created_at', { ascending: false });

  if (reviewsError) {
    console.error('Error fetching reviews:', reviewsError);
    return [];
  }

  // Fetch library status for all authors of these reviews for this media
  const authorIds = (reviewsData as any)?.map((r: any) => r.user_id) || [];
  const { data: libraryData } = await supabase
    .from('user_library')
    .select('user_id, media!inner(external_id)')
    .eq('media.external_id', mediaId)
    .in('user_id', authorIds);

  const verifiedUserIds = new Set(libraryData?.map((l: any) => l.user_id));

  return (reviewsData || []).map((review: any) => ({
    ...review,
    likes_count: review.review_likes?.length || 0,
    is_liked: user ? review.review_likes?.some((l: any) => l.user_id === user.id) : false,
    is_verified: verifiedUserIds.has(review.user_id)
  }));
};

export const getUserReview = async (mediaId: string): Promise<Review | null> => {
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;
  if (!user) return null;

  const { data, error } = await supabase
    .from('reviews')
    .select(`
      *,
      profiles:user_id(username, avatar_url),
      review_likes(user_id),
      media!inner(external_id)
    `)
    .eq('media.external_id', mediaId)
    .eq('user_id', user.id)
    .maybeSingle();

  if (error || !data) return null;

  return {
    ...data as any,
    likes_count: (data as any).review_likes?.length || 0,
    is_liked: (data as any).review_likes?.some((l: any) => l.user_id === user.id)
  };
};

export const toggleReviewLike = async (reviewId: string) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Authentication required');

  const { data: existing } = await supabase
    .from('review_likes')
    .select('id')
    .eq('review_id', reviewId)
    .eq('user_id', user.id)
    .maybeSingle();

  if (existing) {
    return await supabase.from('review_likes').delete().eq('id', existing.id);
  } else {
    return await supabase.from('review_likes').insert({
      review_id: reviewId,
      user_id: user.id
    });
  }
};
