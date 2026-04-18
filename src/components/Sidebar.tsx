import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Gamepad2, Film, Tv, Library, Sparkles, Settings, LogOut, User, Crown, Users, Rss, Timer, CalendarDays } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useStore } from '@/store/useStore';
import { useTranslation } from '@/hooks/useTranslation';
import { getPendingRequests } from '@/services/friendsService';

export function Sidebar() {
  const location = useLocation();
  const { logout, isAdmin } = useStore();
  const { t } = useTranslation();
  const [pendingCount, setPendingCount] = useState(0);
  const [unreadFeedCount, setUnreadFeedCount] = useState(0);

  useEffect(() => {
    // Defer friends and activity calls to improve perceived startup speed
    const timeoutId = setTimeout(() => {
      getPendingRequests()
        .then(requests => setPendingCount(requests.length))
        .catch(err => console.warn('Sidebar friend requests check deferred/failed:', err));
    }, 2000);
    
    setUnreadFeedCount(0); // TODO: implement real unread logic
    return () => clearTimeout(timeoutId);
  }, []);

  const navItems = [
    { icon: Home, labelKey: 'home', path: '/' },
    { icon: Rss, labelKey: 'feed', path: '/feed' },
    { icon: CalendarDays, labelKey: 'calendar', path: '/calendar' },
    { icon: Timer, labelKey: 'countdown', path: '/countdown' },
    { icon: Gamepad2, labelKey: 'games', path: '/games' },
    { icon: Film, labelKey: 'movies', path: '/movies' },
    { icon: Tv, labelKey: 'series', path: '/series' },
    { icon: Library, labelKey: 'myLibrary', path: '/library' },
    { icon: Users, labelKey: 'friends', path: '/friends' },
    { icon: Sparkles, labelKey: 'forYou', path: '/for-you' },
    { icon: User, labelKey: 'profile', path: '/profile' },
  ] as const;

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
                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 relative",
                isActive 
                  ? "bg-white/10 text-white font-medium" 
                  : "text-gray-400 hover:text-white hover:bg-white/5"
              )}
            >
              <item.icon className={cn("w-5 h-5", isActive ? "text-blue-400" : "")} />
              {t(item.labelKey)}
              {item.path === '/friends' && pendingCount > 0 && (
                <span className="absolute right-4 w-4 h-4 rounded-full bg-red-500 flex items-center justify-center text-[10px] text-white">
                  {pendingCount}
                </span>
              )}
              {item.path === '/feed' && unreadFeedCount > 0 && (
                <span className="absolute right-4 w-4 h-4 rounded-full bg-red-500 flex items-center justify-center text-[10px] text-white">
                  {unreadFeedCount}
                </span>
              )}
            </Link>
          );
        })}
        {isAdmin && (
          <Link
            to="/admin"
            className={cn(
              "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200",
              location.pathname === '/admin'
                ? "bg-yellow-500/10 text-yellow-500 font-medium"
                : "text-gray-400 hover:text-yellow-500 hover:bg-yellow-500/5"
            )}
          >
            <Crown className={cn("w-5 h-5", location.pathname === '/admin' ? "text-yellow-500" : "")} />
            Admin Panel
          </Link>
        )}
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
          {t('settings')}
        </Link>
        <button
          onClick={() => logout()}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-gray-400 hover:text-red-400 hover:bg-red-400/10"
        >
          <LogOut className="w-5 h-5" />
          {t('logout')}
        </button>
      </div>
    </aside>
  );
}
