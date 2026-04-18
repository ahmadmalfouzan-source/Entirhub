import React, { useState } from 'react';
import { Review, toggleReviewLike, deleteReview } from '@/services/reviewService';
import { Star, Heart, Edit2, Trash2, CheckCircle2, MoreVertical, AlertTriangle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useStore } from '@/store/useStore';

interface ReviewCardProps {
  review: Review;
  onEdit: (review: Review) => void;
  onDelete: (reviewId: string) => void;
  onLikeToggle: (reviewId: string) => void;
}

export const ReviewCard: React.FC<ReviewCardProps> = ({ review, onEdit, onDelete, onLikeToggle }) => {
  const { user } = useStore();
  const [showSpoiler, setShowSpoiler] = useState(false);
  const isOwner = user?.id === review.user_id;

  const handleLike = async () => {
    if (!user) {
      toast.error('Sign in to like reviews');
      return;
    }
    onLikeToggle(review.id);
  };

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this review?')) {
      try {
        await deleteReview(review.id);
        onDelete(review.id);
        toast.success('Review deleted');
      } catch (err: any) {
        toast.error('Failed to delete review');
      }
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-[#111827] border border-white/5 rounded-2xl overflow-hidden group hover:border-white/10 transition-colors"
    >
      <div className="p-5 space-y-4">
        {/* Header: User Profile & Meta */}
        <div className="flex items-start justify-between">
          <div className="flex gap-3">
            <img 
              src={review.profiles?.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop'} 
              className="size-10 rounded-full ring-2 ring-white/5 object-cover"
              alt=""
            />
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-bold text-white hover:underline cursor-pointer">
                  {review.profiles?.username || 'Anonymous'}
                </span>
                {review.is_verified && (
                  <div className="flex items-center gap-1 bg-green-500/10 text-green-500 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-tighter">
                    <CheckCircle2 className="size-3" />
                    <span>Verified</span>
                  </div>
                )}
              </div>
              <span className="text-[10px] text-gray-500 font-medium">
                {formatDistanceToNow(new Date(review.created_at))} ago
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-yellow-500/10 text-yellow-500 px-2 py-1 rounded-lg">
              <Star className="size-3 fill-current" />
              <span className="text-xs font-black">{review.rating}</span>
            </div>
            {isOwner && (
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button variant="ghost" size="icon-xs" onClick={() => onEdit(review)}>
                  <Edit2 className="size-3.5 text-gray-400 hover:text-white" />
                </Button>
                <Button variant="ghost" size="icon-xs" onClick={handleDelete}>
                  <Trash2 className="size-3.5 text-gray-400 hover:text-red-500" />
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Content: Review Text */}
        <div className="relative">
          {review.contains_spoilers && !showSpoiler ? (
            <div className="relative rounded-xl overflow-hidden">
              <div className="bg-white/5 backdrop-blur-xl p-8 flex flex-col items-center justify-center text-center space-y-3">
                <AlertTriangle className="size-8 text-yellow-500 animate-pulse" />
                <div className="space-y-1">
                  <p className="text-sm font-bold text-white">Spoiler Alert!</p>
                  <p className="text-xs text-gray-400 max-w-[200px]">This review contains plot details that might reveal secrets.</p>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setShowSpoiler(true)}
                  className="bg-white/10 border-white/10 hover:bg-white/20 transition-all font-bold"
                >
                  Show Content
                </Button>
              </div>
              <p className="absolute inset-0 -z-10 blur-md opacity-20 p-2 text-sm text-gray-400">
                {review.content}
              </p>
            </div>
          ) : (
            <p className="text-sm leading-relaxed text-gray-300 whitespace-pre-wrap break-words">
              {review.content}
            </p>
          )}
        </div>

        {/* Footer: Interactions */}
        <div className="flex items-center justify-between pt-2 border-t border-white/5">
          <div className="flex items-center gap-4">
            <button 
              onClick={handleLike}
              className={`flex items-center gap-1.5 group/like transition-all ${
                review.is_liked ? 'text-red-500' : 'text-gray-500 hover:text-red-400'
              }`}
            >
              <div className={`p-1.5 rounded-full transition-colors ${
                review.is_liked ? 'bg-red-500/10' : 'group-hover/like:bg-red-500/10'
              }`}>
                <Heart className={`size-4 ${review.is_liked ? 'fill-current' : ''}`} />
              </div>
              <span className="text-xs font-bold">{review.likes_count || 0}</span>
            </button>
            
            <button className="text-gray-500 hover:text-white transition-colors flex items-center gap-1.5 group/share">
              <div className="p-1.5 rounded-full group-hover/share:bg-white/5">
                <MoreVertical className="size-4" />
              </div>
              <span className="text-xs font-bold">More</span>
            </button>
          </div>

          <div className="text-[10px] font-bold text-gray-600 tracking-widest uppercase italic">
            #ReviewSystemV1
          </div>
        </div>
      </div>
    </motion.div>
  );
}
