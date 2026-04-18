import React, { useState, useEffect, useMemo } from 'react';
import { Review, getMediaReviews, getUserReview, toggleReviewLike } from '@/services/reviewService';
import { ReviewCard } from './ReviewCard';
import { ReviewForm } from './ReviewForm';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useStore } from '@/store/useStore';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare, Star, SlidersHorizontal, Users, Filter } from 'lucide-react';
import { toast } from 'sonner';

interface ReviewSectionProps {
  mediaId: string;
}

type SortOption = 'newest' | 'most_liked' | 'friends';

export function ReviewSection({ mediaId }: ReviewSectionProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [userReview, setUserReview] = useState<Review | null>(null);
  const [friendIds, setFriendIds] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingReview, setEditingReview] = useState<Review | null>(null);
  
  const { user } = useStore();

  useEffect(() => {
    loadData();
  }, [mediaId, user]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [reviewsData, userRevData] = await Promise.all([
        getMediaReviews(mediaId),
        user ? getUserReview(mediaId) : Promise.resolve(null)
      ]);
      
      setReviews(reviewsData);
      setUserReview(userRevData);

      if (user) {
        const { data: friends } = await supabase
          .from('friendships')
          .select('sender_id, receiver_id')
          .eq('status', 'accepted')
          .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`);

        const ids = friends?.map(f => f.sender_id === user.id ? f.receiver_id : f.sender_id) || [];
        setFriendIds(ids);
      }
    } catch (err) {
      console.error('Error loading reviews:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLikeToggle = async (reviewId: string) => {
    try {
      await toggleReviewLike(reviewId);
      // Optimistic update
      setReviews(prev => prev.map(r => {
        if (r.id === reviewId) {
          const newIsLiked = !r.is_liked;
          return {
            ...r,
            is_liked: newIsLiked,
            likes_count: (r.likes_count || 0) + (newIsLiked ? 1 : -1)
          };
        }
        return r;
      }));
    } catch (err: any) {
      toast.error(err.message || 'Failed to toggle like');
    }
  };

  const sortedReviews = useMemo(() => {
    const list = [...reviews];
    switch (sortBy) {
      case 'most_liked':
        return list.sort((a, b) => (b.likes_count || 0) - (a.likes_count || 0));
      case 'friends':
        return list.sort((a, b) => {
          const aIsFriend = friendIds.includes(a.user_id);
          const bIsFriend = friendIds.includes(b.user_id);
          if (aIsFriend && !bIsFriend) return -1;
          if (!aIsFriend && bIsFriend) return 1;
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        });
      case 'newest':
      default:
        return list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }
  }, [reviews, sortBy, friendIds]);

  const averageRating = useMemo(() => {
    if (reviews.length === 0) return 0;
    const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
    return (sum / reviews.length).toFixed(1);
  }, [reviews]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
        <p className="text-gray-500 text-sm font-medium animate-pulse tracking-widest uppercase">Fetching Reviews...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Summary Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-white/5">
        <div className="flex items-center gap-6">
          <div className="flex flex-col">
            <span className="text-4xl font-black text-white">{averageRating}</span>
            <div className="flex items-center gap-1 mt-1">
              {[1, 2, 3, 4, 5].map(i => (
                <Star key={i} className={`size-3 ${i <= Math.round(Number(averageRating) / 2) ? 'fill-yellow-500 text-yellow-500' : 'text-white/10'}`} />
              ))}
            </div>
          </div>
          <div className="h-10 w-px bg-white/5" />
          <div className="flex flex-col">
            <span className="text-sm font-bold text-white uppercase tracking-wider">{reviews.length} Reviews</span>
            <span className="text-xs text-gray-500">Community Consensus</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
            <SelectTrigger className="w-[160px] bg-white/5 border-white/10 rounded-xl h-10">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="size-3.5 text-gray-500" />
                <SelectValue placeholder="Sort by" />
              </div>
            </SelectTrigger>
            <SelectContent className="bg-surface border-white/10 text-white">
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="most_liked">Most Liked</SelectItem>
              <SelectItem value="friends">Friends First</SelectItem>
            </SelectContent>
          </Select>
          
          {user && !userReview && !isFormOpen && (
            <Button onClick={() => setIsFormOpen(true)} className="bg-primary hover:bg-primary/90 text-white font-bold h-10 px-6 rounded-xl shadow-lg shadow-primary/20">
              Write Review
            </Button>
          )}
        </div>
      </div>

      {/* Review Form Area */}
      <AnimatePresence mode="wait">
        {(isFormOpen || editingReview) && (
          <ReviewForm
            mediaId={mediaId}
            existingReview={editingReview || userReview}
            onSuccess={() => {
              setIsFormOpen(false);
              setEditingReview(null);
              loadData();
            }}
            onCancel={() => {
              setIsFormOpen(false);
              setEditingReview(null);
            }}
          />
        )}
      </AnimatePresence>

      {/* Current User Review Highlight */}
      {userReview && !editingReview && !isFormOpen && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              Your Review
            </h4>
            <Button variant="ghost" size="sm" onClick={() => setEditingReview(userReview)} className="text-xs font-bold text-gray-400 hover:text-white">
              Edit My Review
            </Button>
          </div>
          <ReviewCard 
            review={userReview} 
            onEdit={setEditingReview}
            onDelete={() => loadData()}
            onLikeToggle={handleLikeToggle}
          />
        </div>
      )}

      {/* Reviews List */}
      <div className="space-y-6">
        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">
          Community Reviews
        </h4>
        
        {sortedReviews.filter(r => r.user_id !== user?.id).length > 0 ? (
          <div className="grid grid-cols-1 gap-6">
            {sortedReviews.filter(r => r.user_id !== user?.id).map((review) => (
              <ReviewCard
                key={review.id}
                review={review}
                onEdit={setEditingReview}
                onDelete={() => loadData()}
                onLikeToggle={handleLikeToggle}
              />
            ))}
          </div>
        ) : (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-20 bg-white/5 rounded-3xl border border-dashed border-white/10 text-center space-y-4"
          >
            <div className="p-4 bg-white/5 rounded-full">
              <MessageSquare className="size-8 text-gray-600" />
            </div>
            <div className="space-y-1">
              <p className="text-white font-bold italic">No other reviews yet...</p>
              <p className="text-sm text-gray-500 max-w-[240px]">Be the first to share your thoughts with the community!</p>
            </div>
            {!user && <p className="text-xs text-primary font-bold uppercase tracking-widest mt-2">Sign in to review</p>}
          </motion.div>
        )}
      </div>
    </div>
  );
}
