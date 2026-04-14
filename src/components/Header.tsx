import { useState, useEffect, useRef } from 'react';
import { Search, Bell, Sun, Moon, Check } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { useLanguageStore } from '@/store/useLanguageStore';
import { useTranslation } from '@/hooks/useTranslation';
import { Input } from '@/components/ui/input';
import { searchMedia, searchAnime, MediaItem } from '@/services/api';
import { Link } from 'react-router-dom';
import { checkAndCreateNotifications, getNotifications, markNotificationAsRead, Notification } from '@/services/notifications';
import { formatDistanceToNow } from 'date-fns';

export function Header() {
  const { user } = useStore();
  const { language, setLanguage } = useLanguageStore();
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<MediaItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    return (localStorage.getItem('theme') as 'dark' | 'light') || 'dark';
  });
  
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'light') {
      root.classList.add('light');
    } else {
      root.classList.remove('light');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (query.trim()) {
        setIsSearching(true);
        const [mediaData, animeData] = await Promise.all([
          searchMedia(query),
          searchAnime(query)
        ]);
        setResults([...mediaData.slice(0, 5), ...animeData]);
        setIsSearching(false);
      } else {
        setResults([]);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  useEffect(() => {
    if (user) {
      const loadNotifications = async () => {
        // First check and create any new notifications
        await checkAndCreateNotifications(user.id);
        // Then fetch all notifications
        const notifs = await getNotifications(user.id);
        setNotifications(notifs);
      };
      loadNotifications();
    }
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNotificationClick = async (id: string) => {
    await markNotificationAsRead(id);
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, is_read: true } : n)
    );
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);

  return (
    <header className="h-14 md:h-20 px-4 md:px-8 flex items-center justify-between bg-card/80 backdrop-blur-md sticky top-0 z-50 border-b border-border">
      {/* Mobile Search Toggle */}
      {!isMobileSearchOpen && (
        <button 
          className="md:hidden p-2 text-muted-foreground hover:text-foreground"
          onClick={() => setIsMobileSearchOpen(true)}
        >
          <Search className="w-5 h-5" />
        </button>
      )}

      {/* Search Bar */}
      <div className={`flex-1 max-w-xl relative ${isMobileSearchOpen ? 'block absolute inset-x-4 top-2 z-50' : 'hidden md:block'}`}>
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 text-muted-foreground" />
        <Input 
          placeholder={t('search')} 
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full pl-9 pr-9 md:pl-10 md:pr-10 bg-white/5 md:bg-white/5 bg-card border border-border md:border-none text-foreground placeholder:text-muted-foreground rounded-full h-10 md:h-12 focus-visible:ring-1 focus-visible:ring-primary text-sm"
          autoFocus={isMobileSearchOpen}
        />
        {isMobileSearchOpen && (
          <button 
            className="absolute right-3 top-1/2 -translate-y-1/2 md:hidden text-muted-foreground hover:text-foreground"
            onClick={() => {
              setIsMobileSearchOpen(false);
              setQuery('');
            }}
          >
            <Check className="w-4 h-4 rotate-45" /> {/* Use Check as close icon for now or add X icon */}
          </button>
        )}
        {query && (
          <div className="absolute top-full mt-2 w-full bg-card border border-border rounded-xl shadow-2xl overflow-hidden z-50">
            {isSearching ? (
              <div className="p-4 text-muted-foreground text-center">Searching...</div>
            ) : results.length > 0 ? (
              <div className="flex flex-col">
                {results.map(item => (
                  <Link 
                    key={item.external_id} 
                    to={`/content/${item.external_id}`}
                    onClick={() => setQuery('')}
                    className="flex items-center gap-3 p-3 hover:bg-white/5 transition-colors"
                  >
                    <img src={item.poster_url} alt={item.title} className="w-10 h-14 object-cover rounded" />
                    <div>
                      <div className="text-foreground font-medium">{item.title}</div>
                      <div className="text-xs text-muted-foreground capitalize">
                        {item.genres?.includes('Anime') ? (
                          <span className="text-primary font-semibold mr-1">Anime</span>
                        ) : (
                          item.media_type
                        )} 
                        • {item.release_date?.substring(0, 4)}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="p-4 text-muted-foreground text-center">No results found</div>
            )}
          </div>
        )}
      </div>

      <div className={`flex items-center gap-2 md:gap-6 ml-2 md:ml-8 ${isMobileSearchOpen ? 'hidden md:flex' : 'flex'}`}>
        <button
          onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')}
          className="bg-white/10 px-3 py-1 rounded-full text-sm font-medium hover:bg-white/20 transition-colors"
        >
          {language === 'en' ? 'AR' : 'EN'}
        </button>

        <button 
          onClick={toggleTheme}
          className="p-2 rounded-full hover:bg-white/10 text-muted-foreground hover:text-foreground transition-colors"
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {theme === 'dark' ? <Sun className="w-5 h-5 md:w-6 md:h-6" /> : <Moon className="w-5 h-5 md:w-6 md:h-6" />}
        </button>

        <div className="relative" ref={dropdownRef}>
          <button 
            className="relative text-muted-foreground hover:text-foreground transition-colors p-2"
            onClick={() => setShowNotifications(!showNotifications)}
          >
            <Bell className="w-5 h-5 md:w-6 md:h-6" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-3.5 h-3.5 md:w-4 md:h-4 bg-red-500 text-white text-[8px] md:text-[10px] font-bold flex items-center justify-center rounded-full">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-72 md:w-80 max-h-96 overflow-y-auto bg-card border border-border rounded-xl shadow-2xl z-50">
              <div className="p-3 md:p-4 border-b border-border flex items-center justify-between sticky top-0 bg-card/95 backdrop-blur-sm">
                <h3 className="font-semibold text-foreground text-sm md:text-base">Notifications</h3>
                {unreadCount > 0 && (
                  <span className="text-[10px] md:text-xs text-muted-foreground">{unreadCount} unread</span>
                )}
              </div>
              
              <div className="flex flex-col">
                {notifications.length > 0 ? (
                  notifications.map(notif => (
                    <div 
                      key={notif.id}
                      onClick={() => handleNotificationClick(notif.id)}
                      className={`flex gap-2 md:gap-3 p-3 md:p-4 border-b border-border/50 cursor-pointer hover:bg-white/5 transition-colors ${!notif.is_read ? 'bg-primary/5' : ''}`}
                    >
                      {notif.poster_url ? (
                        <img src={notif.poster_url} alt="Poster" className="w-8 h-12 md:w-10 md:h-14 object-cover rounded" />
                      ) : (
                        <div className="w-8 h-12 md:w-10 md:h-14 bg-white/10 rounded flex items-center justify-center">
                          <Bell className="w-3 h-3 md:w-4 md:h-4 text-muted-foreground" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-medium text-xs md:text-sm text-foreground truncate">{notif.title}</h4>
                          {!notif.is_read && <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-primary rounded-full mt-1.5 flex-shrink-0" />}
                        </div>
                        <p className="text-[10px] md:text-xs text-muted-foreground mt-1 line-clamp-2">{notif.message}</p>
                        <span className="text-[8px] md:text-[10px] text-muted-foreground/70 mt-1 md:mt-2 block">
                          {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true })}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-6 md:p-8 text-center text-muted-foreground text-xs md:text-sm">
                    No new notifications
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-2 md:gap-3">
          <div className="text-right hidden md:block">
            <div className="text-sm font-medium text-foreground">{user?.email?.split('@')[0] || 'Guest'}</div>
            <div className="text-xs text-muted-foreground">Free Plan</div>
          </div>
          <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold uppercase text-sm md:text-base">
            {user?.email?.[0] || 'G'}
          </div>
        </div>
      </div>
    </header>
  );
}
