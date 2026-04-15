import { Link, useLocation } from 'react-router-dom';
import { Home, Gamepad2, Film, Tv, Library, Sparkles, User, Settings, Crown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useStore } from '@/store/useStore';

const navItems = [
  { icon: Home, label: 'Home', path: '/' },
  { icon: Library, label: 'Library', path: '/library' },
  { icon: Sparkles, label: 'For You', path: '/for-you' },
  { icon: User, label: 'Profile', path: '/profile' },
  { icon: Settings, label: 'Settings', path: '/settings' },
];

export function BottomNav() {
  const location = useLocation();
  const { isAdmin } = useStore();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#0a0f1e]/95 backdrop-blur-md border-t border-white/10 z-50 px-2 py-2 flex items-center justify-around">
      {navItems.map((item) => {
        const isActive = location.pathname === item.path;
        return (
          <Link
            key={item.path}
            to={item.path}
            className={cn(
              "relative flex flex-col items-center justify-center p-2 rounded-xl transition-all duration-200",
              isActive 
                ? "text-blue-400 bg-blue-500/20" 
                : "text-gray-400 hover:text-white"
            )}
          >
            {isActive && (
              <div className="absolute -top-1 w-6 h-1 bg-blue-400 rounded-full" />
            )}
            <item.icon className={cn("w-6 h-6 transition-all duration-200", isActive ? "scale-110" : "")} />
          </Link>
        );
      })}
      {isAdmin && (
        <Link
          to="/admin"
          className={cn(
            "relative flex flex-col items-center justify-center p-2 rounded-xl transition-all duration-200",
            location.pathname === '/admin'
              ? "text-yellow-500 bg-yellow-500/20"
              : "text-gray-400 hover:text-yellow-500"
          )}
        >
          <Crown className={cn("w-6 h-6 transition-all duration-200", location.pathname === '/admin' ? "scale-110" : "")} />
        </Link>
      )}
    </nav>
  );
}
