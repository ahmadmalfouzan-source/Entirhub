import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Search, Bell, Settings, X, Menu, Home, Film, Tv, Gamepad2, List } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { useTranslation } from '@/hooks/useTranslation';
import { searchMedia, searchAnime, fetchGames, MediaItem } from '@/services/api';
import { checkAndCreateNotifications, getNotifications, markNotificationAsRead, Notification } from '@/services/notifications';
import { formatDistanceToNow } from 'date-fns';
import { StarField } from '@/components/disney/StarField';

export function DisneyLayout({ children }: { children: React.ReactNode }) {
  const { user, avatarUrl } = useStore();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const username = user?.user_metadata?.username || user?.email?.split('@')[0] || 'Guest';

  // Search Logic
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<MediaItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (query.trim()) {
        setIsSearching(true);
        const [mediaData, animeData, gameData] = await Promise.all([
          searchMedia(query),
          searchAnime(query),
          fetchGames(query)
        ]);
        setResults([
          ...(mediaData || []).slice(0, 8), 
          ...(animeData || []).slice(0, 4), 
          ...(gameData || []).slice(0, 6)
        ]);
        setIsSearching(false);
      } else {
        setResults([]);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  // Notifications Logic
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) {
      const loadNotifications = async () => {
        try {
          await checkAndCreateNotifications(user.id);
          const notifs = await getNotifications(user.id);
          setNotifications(notifs);
        } catch (e) {
          console.warn('Notifications check deferred/failed:', e);
        }
      };
      loadNotifications();
    }
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target as Node) && !query) {
        setIsSearchExpanded(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [query]);

  const handleNotificationClick = async (id: string) => {
    await markNotificationAsRead(id);
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, is_read: true } : n)
    );
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  // Header Scroll Effect
  const [isScrolled, setIsScrolled] = useState(false);
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Disney Active Link styling
  const isActive = (path: string) => location.pathname === path;
  const navLinkStyle = (path: string) => `relative flex items-center h-full px-2 lg:px-4 text-[#f9f9f9] text-xs lg:text-sm font-bold uppercase tracking-widest transition-all hover:text-white ${
    isActive(path) ? 'after:content-[""] after:absolute after:bottom-0 after:left-2 after:right-2 lg:after:left-4 lg:after:right-4 after:h-[3px] after:bg-[#0063e5] after:shadow-[0_-2px_10px_2px_rgba(0,99,229,0.8)] after:rounded-t-md' : ''
  }`;

  return (
    <div className="flex flex-col min-h-screen text-[#f9f9f9] relative bg-[#040714] overflow-x-hidden">
      <StarField />
      
      {/* Disney+ style Top Nav Header */}
      <header className={`fixed top-0 z-50 w-full h-16 md:h-20 transition-colors duration-300 ${isScrolled ? 'bg-[#040714]' : 'bg-transparent'}`}>
        <div className="flex items-center justify-between px-2 sm:px-4 md:px-10 h-full">
          
          <div className="flex items-center h-full gap-2 md:gap-10">
            {/* Mobile Menu Toggle */}
            <button 
              className="lg:hidden p-2 text-white min-h-[44px] min-w-[44px] flex items-center justify-center focus:outline-none"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>

            {/* Mock Disney+ Logo */}
            <Link to="/" className="flex flex-col items-center justify-center shrink-0 mt-1">
               <span className="text-xl md:text-3xl font-black text-white tracking-tighter -mb-1" style={{ fontFamily: 'monospace' }}>
                ENTERTAIN
              </span>
              <span className="text-[10px] md:text-xs tracking-[0.3em] text-[#0063e5] font-bold">
                HUB+
              </span>
            </Link>
            
            <nav className="hidden lg:flex items-center h-full text-sm">
              <Link to="/" className={navLinkStyle('/')}>
                <img src="https://cdn-icons-png.flaticon.com/128/1946/1946436.png" className="w-4 h-4 mr-2 invert opacity-90" alt="Home" />
                Home
              </Link>
              <Link to="/series" className={navLinkStyle('/series')}>
                <img src="https://cdn-icons-png.flaticon.com/128/3160/3160163.png" className="w-4 h-4 mr-2 invert opacity-90" alt="Series" />
                Series
              </Link>
              <Link to="/movies" className={navLinkStyle('/movies')}>
                <img src="https://cdn-icons-png.flaticon.com/128/3172/3172568.png" className="w-4 h-4 mr-2 invert opacity-90" alt="Movies" />
                Movies
              </Link>
              <Link to="/games" className={navLinkStyle('/games')}>
                <img src="https://cdn-icons-png.flaticon.com/128/808/808439.png" className="w-4 h-4 mr-2 invert opacity-90" alt="Games" />
                Games
              </Link>
              <Link to="/library" className={navLinkStyle('/library')}>
                 <img src="https://cdn-icons-png.flaticon.com/128/1828/1828817.png" className="w-4 h-4 mr-2 invert opacity-90" alt="Library" />
                 Watchlist
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-1 sm:gap-3 md:gap-5">
            {/* Search */}
            <div ref={searchRef} className={`flex items-center transition-all duration-300 border ${isSearchExpanded ? 'bg-black/80 md:bg-black/60 border-gray-600 rounded-md md:rounded-full px-2 md:px-3 py-1.5' : 'border-transparent'}`}>
              <button 
                onClick={() => setIsSearchExpanded(true)}
                className="text-white hover:text-gray-300 transition focus:outline-none min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                <Search className="w-5 h-5 md:w-5 md:h-5" />
              </button>
              {isSearchExpanded && (
                <div className="absolute top-16 left-0 right-0 px-4 bg-[#0a0f1e] py-3 md:py-0 md:bg-transparent md:relative md:top-0 md:px-0 flex items-center shadow-lg md:shadow-none border-b border-gray-800 md:border-none z-50">
                  <input
                    autoFocus
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search by title, character, or genre"
                    className="bg-transparent border-none outline-none text-sm w-full md:w-64 md:ml-2 placeholder:text-gray-400 text-white"
                  />
                  {query && (
                    <button onClick={() => setQuery('')} className="absolute right-6 top-1/2 -translate-y-1/2 md:right-0 md:relative min-h-[44px] min-w-[44px] flex items-center justify-center">
                      <X className="w-5 h-5 md:w-4 md:h-4 text-white" />
                    </button>
                  )}
                  {/* Results Dropdown */}
                  {query && (
                    <div className="absolute top-full mt-0 md:mt-4 left-0 right-0 md:left-auto md:right-0 w-full md:w-96 bg-[#0c1221] border-t md:border border-[#1a1f33] rounded-b-lg md:rounded-lg shadow-2xl overflow-hidden z-[60]">
                      {isSearching ? (
                        <div className="p-4 text-gray-400 text-sm">Searching the galaxy...</div>
                      ) : results.length > 0 ? (
                        <div className="max-h-[70vh] overflow-y-auto">
                          {results.map(item => (
                            <Link 
                              key={item.external_id} 
                              to={`/content/${item.external_id}`}
                              onClick={() => { setQuery(''); setIsSearchExpanded(false); }}
                              className="flex items-center gap-3 p-3 hover:bg-white/10 transition-colors border-b border-[#1a1f33] min-h-[60px]"
                            >
                              <img src={item.poster_url} alt="" className="w-12 h-16 object-cover rounded shadow" />
                              <div className="min-w-0">
                                <div className="text-white font-bold text-sm truncate">{item.title}</div>
                                <div className="text-xs text-blue-400 capitalize">{item.media_type} • {item.release_date?.substring(0, 4)}</div>
                              </div>
                            </Link>
                          ))}
                        </div>
                      ) : (
                        <div className="p-4 text-gray-400 text-sm text-center">No results found</div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Notifications */}
            <div className="relative hidden sm:block" ref={dropdownRef}>
              <button 
                className="p-2 text-white hover:text-gray-300 transition relative min-h-[44px] min-w-[44px] flex items-center justify-center"
                onClick={() => setShowNotifications(!showNotifications)}
              >
                <Bell className="w-5 h-5 md:w-5 md:h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-2 right-2 md:top-1 md:right-1 w-4 h-4 bg-[#0063e5] text-white text-[10px] font-bold flex items-center justify-center rounded-full border border-[#040714]">
                    {unreadCount}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-4 w-72 md:w-96 bg-[#0c1221] border border-[#1a1f33] rounded-lg shadow-2xl z-[60]">
                  <div className="p-4 border-b border-[#1a1f33]">
                    <h3 className="font-bold text-sm tracking-wider uppercase text-gray-300">Notifications</h3>
                  </div>
                  <div className="max-h-[50vh] overflow-y-auto">
                    {notifications.length > 0 ? (
                      notifications.slice(0, 10).map(notif => (
                        <div 
                          key={notif.id}
                          onClick={() => handleNotificationClick(notif.id)}
                          className={`flex gap-3 p-4 border-b border-[#1a1f33] cursor-pointer hover:bg-white/5 transition-colors min-h-[72px] ${!notif.is_read ? 'bg-white/5' : ''}`}
                        >
                          {notif.poster_url ? (
                            <img src={notif.poster_url} alt="" className="w-10 h-14 object-cover rounded shadow" />
                          ) : (
                            <div className="w-10 h-14 bg-[#1a1f33] rounded flex items-center justify-center">
                              <Bell className="w-4 h-4 text-gray-400" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0 flex flex-col justify-center">
                             <h4 className="font-bold text-xs md:text-sm truncate text-white">{notif.title}</h4>
                             <p className="text-[11px] text-gray-400 mt-1 line-clamp-2">{notif.message}</p>
                             <span className="text-[10px] text-[#0063e5] mt-1 block font-bold">
                                {formatDistanceToNow(new Date(notif.created_at || new Date()), { addSuffix: true })}
                             </span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-8 text-center text-gray-500 text-sm">You have no new messages.</div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Settings */}
            <Link to="/settings" className="p-2 text-white hover:text-gray-300 transition hidden sm:flex items-center justify-center min-h-[44px] min-w-[44px]">
              <Settings className="w-5 h-5 md:w-5 md:h-5" />
            </Link>

            {/* Avatar */}
            <Link to="/profile" className="flex items-center justify-center relative cursor-pointer group ml-1 md:ml-2 min-h-[44px] min-w-[44px]">
               {avatarUrl ? (
                  <img src={avatarUrl} alt="Avatar" className="w-8 h-8 md:w-10 md:h-10 rounded-full shrink-0 object-cover border-[3px] border-transparent group-hover:border-white transition-all shadow-lg" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-8 h-8 md:w-10 md:h-10 rounded-full shrink-0 bg-gradient-to-tr from-[#0063e5] to-[#4db5ff] flex items-center justify-center text-white font-bold border-[3px] border-transparent group-hover:border-white transition-all shadow-lg text-xs md:text-sm">
                    {username[0]?.toUpperCase()}
                  </div>
                )}
            </Link>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {isMobileMenuOpen && (
          <div className="lg:hidden absolute top-16 left-0 right-0 bg-[#0c1221] border-b border-[#1a1f33] shadow-xl overflow-hidden animate-in slide-in-from-top-4 duration-200 z-[40]">
            <nav className="flex flex-col py-2">
              <Link to="/" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-4 px-6 py-4 text-base font-bold text-white hover:bg-white/10 transition-colors uppercase tracking-widest">
                <Home className="w-5 h-5" /> Home
              </Link>
              <Link to="/series" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-4 px-6 py-4 text-base font-bold text-gray-400 hover:text-white hover:bg-white/10 transition-colors uppercase tracking-widest">
                <Tv className="w-5 h-5" /> Series
              </Link>
              <Link to="/movies" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-4 px-6 py-4 text-base font-bold text-gray-400 hover:text-white hover:bg-white/10 transition-colors uppercase tracking-widest">
                <Film className="w-5 h-5" /> Movies
              </Link>
              <Link to="/games" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-4 px-6 py-4 text-base font-bold text-gray-400 hover:text-white hover:bg-white/10 transition-colors uppercase tracking-widest">
                <Gamepad2 className="w-5 h-5" /> Games
              </Link>
              <Link to="/library" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-4 px-6 py-4 text-base font-bold text-gray-400 hover:text-white hover:bg-white/10 transition-colors uppercase tracking-widest">
                <List className="w-5 h-5" /> Watchlist
              </Link>
              {/* Mobile-only tools down lower for reachability */}
               <div className="h-px bg-[#1a1f33] my-2 mx-4" />
               <Link to="/settings" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-4 px-6 py-4 text-base font-bold text-gray-400 hover:text-white hover:bg-white/10 transition-colors sm:hidden uppercase tracking-widest">
                <Settings className="w-5 h-5" /> Settings
              </Link>
               <button onClick={() => { setIsMobileMenuOpen(false); setShowNotifications(true); }} className="flex items-center gap-4 px-6 py-4 text-base font-bold text-gray-400 hover:text-white hover:bg-white/10 transition-colors sm:hidden w-full text-left uppercase tracking-widest">
                <div className="relative">
                  <Bell className="w-5 h-5" />
                   {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-[#0063e5] rounded-full" />
                  )}
                </div>
                Notifications
              </button>
            </nav>
          </div>
        )}
      </header>
      
      {/* Content Area */}
      <main className="flex-1 w-full pb-20 relative z-10 pt-16 md:pt-20">
        <div className="relative flex flex-col items-center">
          {children}
        </div>
      </main>
    </div>
  );
}
