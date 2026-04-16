import { Link, useLocation } from 'react-router-dom';
import { Home, Gamepad2, Film, Tv, Library, Sparkles, User, Settings, Crown, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useStore } from '@/store/useStore';

const navItems = [
  { icon: Home, label: 'Home', path: '/' },
  { icon: Gamepad2, label: 'Games', path: '/games' },
  { icon: Film, label: 'Movies', path: '/movies' },
  { icon: Tv, label: 'Series', path: '/series' },
  { icon: Library, label: 'Library', path: '/library' },
  { icon: Sparkles, label: 'For You', path: '/for-you' },
  { icon: User, label: 'Profile', path: '/profile' },
  { icon: Settings, label: 'Settings', path: '/settings' },
];

export function BottomNav() {
  const location = useLocation();
  const { isAdmin, logout } = useStore();

  return (
    <>
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#0a0f1e]/95 backdrop-blur-md border-t border-white/10 z-50 px-2 py-2 flex items-center justify-start overflow-x-auto gap-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] scroll-smooth">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "relative flex flex-col items-center justify-center p-3 min-w-[64px] min-h-[44px] rounded-xl transition-all duration-200 active:scale-95 shrink-0",
                isActive 
                  ? "text-blue-400 bg-blue-500/20" 
                  : "text-gray-400 hover:text-white"
              )}
            >
              {isActive && (
                <div className="absolute -top-1 w-6 h-1 bg-blue-400 rounded-full" />
              )}
              <item.icon className={cn("w-6 h-6 transition-all duration-200", isActive ? "scale-110" : "")} />
              <span className="text-[10px] mt-1 font-medium">{item.label}</span>
            </Link>
          );
        })}
        {isAdmin && (
          <Link
            to="/admin"
            className={cn(
              "relative flex flex-col items-center justify-center p-3 min-w-[64px] min-h-[44px] rounded-xl transition-all duration-200 active:scale-95 shrink-0",
              location.pathname === '/admin'
                ? "text-yellow-500 bg-yellow-500/20"
                : "text-gray-400 hover:text-yellow-500"
            )}
          >
            <Crown className={cn("w-6 h-6 transition-all duration-200", location.pathname === '/admin' ? "scale-110" : "")} />
            <span className="text-[10px] mt-1 font-medium">Admin</span>
          </Link>
        )}
        <button
          onClick={() => logout()}
          className="relative flex flex-col items-center justify-center p-3 min-w-[64px] min-h-[44px] rounded-xl transition-all duration-200 active:scale-95 shrink-0 text-gray-400 hover:text-red-400"
        >
          <LogOut className="w-6 h-6 transition-all duration-200" />
          <span className="text-[10px] mt-1 font-medium">Logout</span>
        </button>
        
        {/* Spacer to ensure the last item is fully visible when scrolled */}
        <div className="w-4 shrink-0" />
      </nav>
      
      {/* Gradient fade to indicate scrollability */}
      <div className="md:hidden fixed bottom-0 right-0 w-12 h-[calc(60px+env(safe-area-inset-bottom))] bg-gradient-to-l from-[#0a0f1e] to-transparent pointer-events-none z-50" />
    </>
  );
}
