import React from 'react';
import { cn } from '@/lib/utils';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  className?: string;
  accentColor?: string;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({ 
  title, 
  subtitle, 
  action, 
  className,
  accentColor = "var(--color-primary)" 
}) => {
  return (
    <div className={cn("flex flex-col space-y-1.5", className)}>
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-black text-white italic uppercase tracking-tight flex items-center gap-2">
          {title}
          <span className="text-primary italic-none">.</span>
        </h3>
        {action}
      </div>
      {subtitle && (
        <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] italic">
          {subtitle}
        </p>
      )}
    </div>
  );
};

interface PremiumBadgeProps {
  children: React.ReactNode;
  variant?: 'primary' | 'accent' | 'glass' | 'outline';
  className?: string;
}

export const PremiumBadge: React.FC<PremiumBadgeProps> = ({ 
  children, 
  variant = 'primary',
  className 
}) => {
  const styles = {
    primary: 'bg-primary/20 text-primary border-primary/30',
    accent: 'bg-accent/20 text-accent border-accent/30',
    glass: 'bg-white/5 text-white border-white/10 backdrop-blur-md',
    outline: 'bg-transparent text-gray-400 border-white/10 hover:text-white',
  };

  return (
    <span className={cn(
      "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-[0.1em] border transition-colors",
      styles[variant],
      className
    )}>
      {children}
    </span>
  );
};
