import { Link, useLocation } from 'react-router-dom';
import { Home, Gamepad2, Film, Tv, Library, Sparkles, Settings, LogOut, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useStore } from '@/store/useStore';

const navItems = [
  { icon: Home, label: 'Home', path: '/' },
  { icon: Gamepad2, label: 'Games', path: '/games' },
  { icon: Film, label: 'Movies', path: '/movies' },
  { icon: Tv, label: 'Series', path: '/series' },
  { icon: Library, label: 'My Library', path: '/library' },
  { icon: Sparkles, label: 'For You', path: '/for-you' },
  { icon: User, label: 'Profile', path: '/profile' },
];

export function Sidebar() {
  const location = useLocation();
  const { logout } = useStore();

  return (
    <aside className="hidden md:flex w-64 bg-[#0a0f1e] border-r border-white/10 flex-col h-screen sticky top-0">
      <div className="p-6">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
            EntertainHub
          </span>
        </Link>
      </div>

      <nav className="flex-1 px-4 space-y-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200",
                isActive 
                  ? "bg-white/10 text-white font-medium" 
                  : "text-gray-400 hover:text-white hover:bg-white/5"
              )}
            >
              <item.icon className={cn("w-5 h-5", isActive ? "text-blue-400" : "")} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 space-y-2">
        <Link
          to="/settings"
          className={cn(
            "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200",
            location.pathname === '/settings'
              ? "bg-white/10 text-white font-medium"
              : "text-gray-400 hover:text-white hover:bg-white/5"
          )}
        >
          <Settings className="w-5 h-5" />
          Settings
        </Link>
        <button
          onClick={() => logout()}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-gray-400 hover:text-red-400 hover:bg-red-400/10"
        >
          <LogOut className="w-5 h-5" />
          Logout
        </button>
      </div>
    </aside>
  );
}
