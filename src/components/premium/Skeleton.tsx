import React from 'react';
import { cn } from '@/lib/utils';
import { motion } from 'motion/react';

interface SkeletonProps {
  className?: string;
  variant?: 'card' | 'circle' | 'text' | 'button';
}

export const Skeleton: React.FC<SkeletonProps> = ({ className, variant = 'text' }) => {
  const variants = {
    card: 'rounded-[32px] aspect-[2/3]',
    circle: 'rounded-full',
    text: 'rounded-lg h-4',
    button: 'rounded-2xl h-12',
  };

  return (
    <motion.div
      initial={{ opacity: 0.5 }}
      animate={{ opacity: [0.5, 0.8, 0.5] }}
      transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
      className={cn(
        "bg-white/5",
        variants[variant],
        className
      )}
    />
  );
};
