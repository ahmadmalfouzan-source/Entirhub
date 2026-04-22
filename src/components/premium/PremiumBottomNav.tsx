import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface NavItem {
  icon: LucideIcon;
  label: string;
  path: string;
}

interface PremiumBottomNavProps {
  items: NavItem[];
}

export const PremiumBottomNav: React.FC<PremiumBottomNavProps> = ({ items }) => {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-[100] px-4 pb-[env(safe-area-inset-bottom)] pt-2 bg-[#030308]/90 backdrop-blur-3xl border-t border-white/5">
      <div className="flex items-center justify-between h-[68px] max-w-lg mx-auto relative">
        {items.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "relative flex flex-col items-center justify-center flex-1 h-full transition-all duration-500 active:scale-95",
                isActive ? "text-primary" : "text-gray-600 hover:text-gray-400"
              )}
            >
              <div className={cn(
                "p-2.5 rounded-2xl transition-all duration-500",
                isActive ? "bg-primary/10 shadow-[0_0_30px_rgba(var(--color-primary-rgb),0.2)]" : "bg-transparent"
              )}>
                <item.icon className={cn("w-6 h-6 transition-transform duration-500", isActive ? "scale-110" : "scale-100")} />
              </div>
              
              <AnimatePresence>
                {isActive && (
                  <motion.span 
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 5 }}
                    className="text-[9px] mt-1 font-black uppercase tracking-[0.2em] italic"
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>

              {isActive && (
                <motion.div 
                  layoutId="nav-indicator"
                  className="absolute -top-[10px] w-12 h-[3px] bg-primary rounded-full shadow-[0_0_12px_var(--color-primary)]"
                />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
