import React, { useState, useEffect } from 'react';
import { Star, AlertTriangle, Send, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { createReview, updateReview, Review } from '@/services/reviewService';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { logActivity } from '@/services/activityService';
import { useStore } from '@/store/useStore';
import { fetchMediaDetails } from '@/services/api';

interface ReviewFormProps {
  mediaId: string;
  existingReview?: Review | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export function ReviewForm({ mediaId, existingReview, onSuccess, onCancel }: ReviewFormProps) {
  const { user } = useStore();
  const [rating, setRating] = useState(existingReview?.rating || 0);
  const [content, setContent] = useState(existingReview?.content || '');
  const [isSpoiler, setIsSpoiler] = useState(existingReview?.contains_spoilers || false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hoveredStar, setHoveredStar] = useState(0);

  const MAX_CHARS = 2000;

  useEffect(() => {
    if (existingReview) {
      setRating(existingReview.rating);
      setContent(existingReview.content);
      setIsSpoiler(existingReview.contains_spoilers);
    }
  }, [existingReview]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      toast.error('Please select a rating');
      return;
    }
    if (!content.trim()) {
      toast.error('Please write a review');
      return;
    }

    setIsSubmitting(true);
    try {
      if (existingReview) {
        await updateReview(existingReview.id, content, rating, isSpoiler);
        toast.success('Review updated!');
      } else {
        const { data: review, error } = await createReview(mediaId, content, rating, isSpoiler);
        if (error) throw error;
        
        // Log activity using the internal media UUID
        if (review && (review as any).media_id) {
          try {
            const type = mediaId.includes('_game_') ? 'game' : 
                         mediaId.includes('_series_') ? 'series' : 'movie';
            const details = await fetchMediaDetails(mediaId, type as any);
            const username = user?.email?.split('@')[0] || 'User';
            await logActivity('reviewed', (review as any).media_id, { 
              rating,
              message: `${username} reviewed ${details?.title || 'Unknown'} ⭐${rating}/10`
            });
          } catch (err) {
            console.warn('Failed to log review activity', err);
          }
        }
        
        toast.success('Review posted!');
      }
      onSuccess();
    } catch (error: any) {
      toast.error(error.message || 'Failed to save review');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="bg-[#111827] border border-white/10 rounded-xl p-6 space-y-6 shadow-2xl"
    >
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-white">
          {existingReview ? 'Update Your Review' : 'Write a Review'}
        </h3>
        <Button variant="ghost" size="icon" onClick={onCancel} className="rounded-full hover:bg-white/10">
          <X className="size-5 text-gray-400" />
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Rating Selector */}
        <div className="space-y-3">
          <Label className="text-xs font-bold text-gray-500 uppercase tracking-widest bg-white/5 px-2 py-1 rounded">
            Rating: {rating || 0} / 10
          </Label>
          <div className="flex items-center gap-1.5 flex-wrap">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((star) => (
              <motion.button
                key={star}
                type="button"
                whileHover={{ scale: 1.2 }}
                whileTap={{ scale: 0.9 }}
                onMouseEnter={() => setHoveredStar(star)}
                onMouseLeave={() => setHoveredStar(0)}
                onClick={() => setRating(star)}
                className="focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-md p-0.5"
              >
                <Star
                  className={`size-7 transition-all duration-200 ${
                    star <= (hoveredStar || rating)
                      ? 'fill-yellow-500 text-yellow-500 drop-shadow-[0_0_8px_rgba(234,179,8,0.4)]'
                      : 'text-white/10'
                  }`}
                />
              </motion.button>
            ))}
          </div>
        </div>

        {/* Content Area */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-gray-500">
            <Label>Your Review</Label>
            <span className={content.length > MAX_CHARS ? 'text-red-500' : ''}>
              {content.length} / {MAX_CHARS}
            </span>
          </div>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            disabled={isSubmitting}
            placeholder="Share your experience... (Min. 10 characters recommended)"
            className="w-full h-40 bg-white/5 border border-white/10 rounded-xl p-4 text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all resize-none shadow-inner"
          />
        </div>

        {/* Spoiler Toggle */}
        <div className="flex items-center space-x-3 p-4 bg-white/5 rounded-xl border border-white/5 group transition-colors hover:bg-white/10">
          <Checkbox
            id="spoiler"
            checked={isSpoiler}
            onCheckedChange={(checked) => setIsSpoiler(checked as boolean)}
            className="border-white/20 data-[state=checked]:bg-yellow-500 data-[state=checked]:border-yellow-500"
          />
          <Label htmlFor="spoiler" className="flex items-center gap-3 cursor-pointer select-none">
            <div className={`p-2 rounded-lg transition-colors ${isSpoiler ? 'bg-yellow-500/10 text-yellow-500' : 'bg-gray-800 text-gray-400'}`}>
              <AlertTriangle className="size-4" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold text-white leading-none">Contains Spoilers</span>
              <span className="text-[10px] font-medium text-gray-500 mt-1">Warn other users before they read</span>
            </div>
          </Label>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button 
            type="button" 
            variant="ghost" 
            onClick={onCancel}
            className="text-gray-400 hover:text-white hover:bg-white/5"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting || content.length > MAX_CHARS || content.length === 0}
            className="bg-primary hover:bg-primary/90 text-white min-w-[140px] h-11 rounded-xl shadow-[0_4px_20px_rgba(var(--color-primary),0.3)] transition-all active:scale-95"
          >
            {isSubmitting ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <div className="flex items-center gap-2">
                <Send className="size-4" />
                <span className="font-bold">{existingReview ? 'Update' : 'Post Review'}</span>
              </div>
            )}
          </Button>
        </div>
      </form>
    </motion.div>
  );
}
