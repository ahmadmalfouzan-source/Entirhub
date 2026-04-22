import React from 'react';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface PremiumInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: LucideIcon;
  label?: string;
  containerClassName?: string;
}

export const PremiumInput = React.forwardRef<HTMLInputElement, PremiumInputProps>(
  ({ className, icon: Icon, label, containerClassName, ...props }, ref) => {
    return (
      <div className={cn("space-y-2", containerClassName)}>
        {label && (
          <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest pl-2">
            {label}
          </label>
        )}
        <div className="relative group">
          {Icon && (
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
              <Icon className="w-4 h-4 text-gray-500 group-focus-within:text-primary transition-colors" />
            </div>
          )}
          <input
            ref={ref}
            className={cn(
              "w-full h-14 bg-white/5 border border-white/5 rounded-3xl text-sm font-bold text-white transition-all placeholder:text-gray-600 focus:outline-none focus:border-primary/30 focus:bg-white/10",
              Icon ? "pl-12 pr-4" : "px-6",
              className
            )}
            {...props}
          />
        </div>
      </div>
    );
  }
);
PremiumInput.displayName = 'PremiumInput';

interface StatWidgetProps {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  color?: string;
  className?: string;
}

export const StatWidget: React.FC<StatWidgetProps> = ({ label, value, icon: Icon, color = 'text-primary', className }) => {
  return (
    <div className={cn("bg-white/5 backdrop-blur-xl border border-white/5 p-5 rounded-[32px] flex flex-col items-center text-center space-y-2", className)}>
      {Icon && <Icon className={cn("w-5 h-5", color)} />}
      <div className="space-y-0.5">
        <div className={cn("text-2xl font-black italic italic-none tracking-tight", color)}>{value}</div>
        <div className="text-[9px] font-black text-gray-600 uppercase tracking-widest">{label}</div>
      </div>
    </div>
  );
};
