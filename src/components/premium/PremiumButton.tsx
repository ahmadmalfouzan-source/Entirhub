import React from 'react';
import { cn } from '@/lib/utils';
import { motion, HTMLMotionProps } from 'motion/react';

interface PremiumButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  variant?: 'neon' | 'glass' | 'ghost' | 'outline' | 'white';
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'icon';
  fullWidth?: boolean;
  children: React.ReactNode;
}

export const PremiumButton = React.forwardRef<HTMLButtonElement, PremiumButtonProps>(
  ({ className, variant = 'neon', size = 'md', fullWidth = false, children, ...props }, ref) => {
    const variants = {
      neon: 'bg-primary text-white shadow-[0_10px_30px_rgba(var(--color-primary-rgb),0.3)] border-transparent',
      glass: 'bg-white/5 backdrop-blur-xl text-white border-white/10 hover:bg-white/10',
      ghost: 'bg-transparent text-gray-400 hover:text-white border-transparent',
      outline: 'bg-transparent text-white border-white/20 hover:border-white/40',
      white: 'bg-white text-black font-black shadow-xl',
    };

    const sizes = {
      sm: 'h-10 px-4 py-2 text-xs',
      md: 'h-12 px-6 py-3 text-xs',
      lg: 'h-14 px-8 py-4 text-sm',
      xl: 'h-16 px-10 py-5 text-sm',
      icon: 'h-12 w-12 flex items-center justify-center p-0',
    };

    return (
      <motion.button
        ref={ref}
        whileTap={{ scale: 0.94 }}
        whileHover={{ y: -4, scale: 1.02 }}
        className={cn(
          'rounded-[24px] font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 border',
          variants[variant],
          sizes[size],
          fullWidth && 'w-full',
          className
        )}
        {...props}
      >
        {children}
      </motion.button>
    );
  }
);
PremiumButton.displayName = 'PremiumButton';
