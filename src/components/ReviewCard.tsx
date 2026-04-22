import React, { useState } from 'react';
import { Review, toggleReviewLike, deleteReview } from '@/services/reviewService';
import { Star, Heart, Edit2, Trash2, CheckCircle2, MoreVertical, AlertTriangle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useStore } from '@/store/useStore';
import { cn } from '@/lib/utils';

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
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[#030308] border border-white/5 rounded-[32px] overflow-hidden group hover:border-white/10 transition-all duration-500 shadow-2xl"
    >
      <div className="p-6 space-y-5">
        {/* Header: User Profile & Meta */}
        <div className="flex items-start justify-between">
          <div className="flex gap-4">
            <div className="relative group/avatar cursor-pointer">
              <div className="size-12 rounded-[18px] bg-gradient-to-br from-primary to-accent p-0.5 shadow-lg group-hover/avatar:rotate-12 transition-transform duration-500">
                <img 
                  src={review.profiles?.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop'} 
                  className="w-full h-full rounded-[16px] object-cover bg-[#030308]"
                  alt=""
                />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-black text-white italic tracking-tighter uppercase group-hover:text-primary transition-colors cursor-pointer">
                  {review.profiles?.username || 'Anonymous'}
                </span>
                {review.is_verified && (
                  <div className="flex items-center gap-1 bg-primary/10 text-primary px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest border border-primary/20">
                    <CheckCircle2 className="size-2.5" />
                    <span>SYNCED</span>
                  </div>
                )}
              </div>
              <span className="text-[10px] text-gray-600 font-black uppercase tracking-widest mt-1 block">
                {formatDistanceToNow(new Date(review.created_at))} AGO • SIGNAL RECEIVED
              </span>
            </div>
          </div>

          <div className="flex flex-col items-end gap-3">
            <div className="flex items-center gap-2 bg-yellow-500/10 text-yellow-500 px-3 py-1.5 rounded-[14px] border border-yellow-500/20 shadow-[0_0_15px_rgba(234,179,8,0.1)]">
              <Star className="size-3.5 fill-current" />
              <span className="text-sm font-black italic">{review.rating}</span>
            </div>
            {isOwner && (
              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0 transition-all">
                <button onClick={() => onEdit(review)} className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-500 hover:text-white transition-all">
                  <Edit2 className="size-3.5" />
                </button>
                <button onClick={handleDelete} className="p-2 rounded-xl bg-red-500/5 hover:bg-red-500/20 text-gray-500 hover:text-red-500 transition-all">
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Content: Review Text */}
        <div className="relative">
          {review.contains_spoilers && !showSpoiler ? (
            <div className="relative rounded-[24px] overflow-hidden">
              <div className="bg-white/[0.02] backdrop-blur-3xl border border-dashed border-white/10 p-10 flex flex-col items-center justify-center text-center space-y-4">
                <div className="size-16 rounded-[24px] bg-yellow-500/10 flex items-center justify-center border border-yellow-500/20">
                   <AlertTriangle className="size-8 text-yellow-500 animate-pulse" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-black text-white italic tracking-widest uppercase">Spoiler Encryption Active</h4>
                  <p className="text-[11px] text-gray-500 font-medium max-w-[240px] leading-relaxed">This transmission contains restricted plot data. Decrypt at your own risk.</p>
                </div>
                <button 
                  onClick={() => setShowSpoiler(true)}
                  className="px-8 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-[10px] text-white font-black uppercase tracking-[0.2em] rounded-2xl transition-all active:scale-95 shadow-xl"
                >
                  DECRYPT LOGS
                </button>
              </div>
            </div>
          ) : (
            <div className="relative">
               <div className="absolute -left-3 top-0 bottom-0 w-1 bg-gradient-to-b from-primary/50 to-transparent rounded-full opacity-50" />
               <p className="text-sm leading-relaxed text-gray-400 font-medium tracking-tight px-2 whitespace-pre-wrap break-words italic">
                "{review.content}"
               </p>
            </div>
          )}
        </div>

        {/* Footer: Interactions */}
        <div className="flex items-center justify-between pt-4 border-t border-white/5">
          <div className="flex items-center gap-6">
            <button 
              onClick={handleLike}
              className={cn(
                "flex items-center gap-2 group/like transition-all",
                review.is_liked ? 'text-red-500' : 'text-gray-600 hover:text-red-400'
              )}
            >
              <div className={cn(
                "size-10 rounded-2xl flex items-center justify-center transition-all",
                review.is_liked ? 'bg-red-500/10 scale-110 shadow-lg' : 'bg-white/5 group-hover/like:bg-red-500/10 group-hover/like:scale-110'
              )}>
                <Heart className={cn("size-4 transition-transform", review.is_liked ? 'fill-current' : 'group-hover/like:scale-125')} />
              </div>
              <span className="text-xs font-black italic">{review.likes_count || 0}</span>
            </button>
            
            <button className="flex items-center gap-2 text-gray-600 hover:text-white transition-all group/more">
              <div className="size-10 rounded-2xl bg-white/5 flex items-center justify-center group-hover/more:bg-white/10 group-hover/more:rotate-90 transition-all">
                <MoreVertical className="size-4" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest">More Data</span>
            </button>
          </div>

          <div className="text-[9px] font-black text-gray-700 tracking-[0.3em] uppercase italic bg-white/[0.02] px-3 py-1 rounded-[8px] border border-white/5">
            LOG.ID // {review.id.slice(0, 8)}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
