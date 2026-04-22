import React from 'react';
import { PremiumCard } from './PremiumCard';
import { Activity, Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProgressCardProps {
  title: string;
  status: string;
  progress: number; // 0 to 1
  rating?: number;
  label?: string;
  color?: string;
}

export const ProgressCard: React.FC<ProgressCardProps> = ({ 
  title, 
  status, 
  progress, 
  rating, 
  label = "OVERALL PROGRESS",
  color = "var(--color-primary)" 
}) => {
  return (
    <PremiumCard className="p-6 border-white/5 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center">
            <Activity className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h4 className="text-sm font-black text-white italic truncate max-w-[120px]">{title}</h4>
            <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">{status}</span>
          </div>
        </div>
        {rating && (
          <div className="flex items-center gap-1 px-3 py-1 bg-white/5 rounded-full border border-white/10">
            <Star className="w-3 h-3 text-yellow-500 fill-current" />
            <span className="text-[10px] font-black text-white">{rating}/5</span>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex justify-between items-end">
          <span className="text-[9px] font-black text-gray-600 uppercase tracking-[0.2em]">{label}</span>
          <span className="text-xs font-black text-white italic">{Math.round(progress * 100)}%</span>
        </div>
        <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
          <div 
            className="h-full rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(var(--color-primary-rgb),0.3)]"
            style={{ 
              width: `${progress * 100}%`,
              backgroundColor: color
            }}
          />
        </div>
      </div>
    </PremiumCard>
  );
};
