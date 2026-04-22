import React from 'react';
import { cn } from '@/lib/utils';
import { motion, HTMLMotionProps } from 'motion/react';

interface PremiumCardProps extends HTMLMotionProps<'div'> {
  variant?: 'glass' | 'solid' | 'neon';
  hoverEffect?: boolean;
  blur?: 'sm' | 'md' | 'lg' | 'xl';
  glowColor?: string;
}

export const PremiumCard = React.forwardRef<HTMLDivElement, PremiumCardProps>(
  ({ className, variant = 'glass', hoverEffect = true, blur = 'xl', glowColor, children, ...props }, ref) => {
    const blurClass = {
      sm: 'backdrop-blur-sm',
      md: 'backdrop-blur-md',
      lg: 'backdrop-blur-lg',
      xl: 'backdrop-blur-xl',
    }[blur];

    return (
      <motion.div
        ref={ref}
        whileHover={hoverEffect ? { scale: 1.02, y: -4 } : undefined}
        whileTap={hoverEffect ? { scale: 0.98 } : undefined}
        className={cn(
          'relative rounded-[32px] border transition-all duration-300 overflow-hidden',
          variant === 'glass' && `${blurClass} bg-white/5 border-white/10`,
          variant === 'solid' && 'bg-[#0a0b14] border-white/5',
          variant === 'neon' && 'bg-[#030308] border-primary/20 shadow-[0_0_30px_rgba(var(--color-primary-rgb),0.1)]',
          className
        )}
        style={{
          boxShadow: glowColor ? `0 0 40px ${glowColor}15` : undefined,
          ...props.style,
        }}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);
PremiumCard.displayName = 'PremiumCard';
