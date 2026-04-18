import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Library, Rss, Timer, Grid3X3, Gamepad2, Film, Tv, Sparkles, User, Settings, Crown, LogOut, CalendarDays } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useStore } from '@/store/useStore';
import { useTranslation } from '@/hooks/useTranslation';

export function BottomNav() {
  const location = useLocation();
  const { isAdmin, logout } = useStore();
  const { t } = useTranslation();
  const [showMore, setShowMore] = useState(false);

  const mainNav = [
    { icon: Home, label: t('home'), path: '/' },
    { icon: Library, label: t('myLibrary'), path: '/library' },
    { icon: Rss, label: t('feed'), path: '/feed' },
    { icon: Timer, label: t('countdown'), path: '/countdown' },
  ];

  const moreItems = [
    { icon: CalendarDays, label: t('calendar'), path: '/calendar' },
    { icon: Gamepad2, label: t('games'), path: '/games' },
    { icon: Film, label: t('movies'), path: '/movies' },
    { icon: Tv, label: t('series'), path: '/series' },
    { icon: Sparkles, label: t('forYou'), path: '/for-you' },
    { icon: User, label: t('profile'), path: '/profile' },
    { icon: Settings, label: t('settings'), path: '/settings' },
  ];

  return (
    <>
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-md border-t border-white/10 z-50 px-2 py-1 flex items-center justify-around pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        {mainNav.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex flex-col items-center justify-center p-2 rounded-lg transition-all active:scale-95",
                isActive ? "text-accent" : "text-gray-400"
              )}
            >
              <item.icon className="w-6 h-6" />
              <span className="text-[10px] mt-0.5 font-medium">{item.label}</span>
            </Link>
          );
        })}
        <button
          onClick={() => setShowMore(!showMore)}
          className={cn("flex flex-col items-center justify-center p-2 rounded-lg transition-all", showMore ? "text-accent" : "text-gray-400")}
        >
          <Grid3X3 className="w-6 h-6" />
          <span className="text-[10px] mt-0.5 font-medium">{t('more')}</span>
        </button>
      </nav>

      {showMore && (
        <div className="md:hidden fixed inset-0 bg-background/95 backdrop-blur-md z-50 p-6 flex flex-col pt-16">
          <button onClick={() => setShowMore(false)} className="absolute top-4 right-4 text-white">Close</button>
          <div className="grid grid-cols-3 gap-6">
            {moreItems.map(item => (
              <Link key={item.path} to={item.path} onClick={() => setShowMore(false)} className="flex flex-col items-center gap-2 text-white">
                <div className="p-4 bg-white/5 rounded-2xl"><item.icon className="w-8 h-8" /></div>
                <span className="text-sm">{item.label}</span>
              </Link>
            ))}
            {isAdmin && (
              <Link to="/admin" onClick={() => setShowMore(false)} className="flex flex-col items-center gap-2 text-white">
                <div className="p-4 bg-yellow-500/10 rounded-2xl"><Crown className="w-8 h-8 text-yellow-500" /></div>
                <span className="text-sm">{t('admin')}</span>
              </Link>
            )}
            <button onClick={() => setShowMore(false) || logout()} className="flex flex-col items-center gap-2 text-red-400">
                <div className="p-4 bg-red-400/10 rounded-2xl"><LogOut className="w-8 h-8" /></div>
                <span className="text-sm">{t('logout')}</span>
            </button>
          </div>
        </div>
      )}
    </>
  );
}
