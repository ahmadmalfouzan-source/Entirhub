import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Search, Bell, Settings, X } from 'lucide-react';
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
    <div className="flex flex-col min-h-screen text-[#f9f9f9] relative bg-[#040714]">
      <StarField />
      
      {/* Disney+ style Top Nav Header */}
      <header className={`fixed top-0 z-50 w-full h-16 md:h-20 transition-colors duration-300 ${isScrolled ? 'bg-[#040714]' : 'bg-transparent'}`}>
        <div className="flex items-center justify-between px-4 md:px-10 h-full">
          
          <div className="flex items-center h-full gap-4 lg:gap-10">
            {/* Mock Disney+ Logo */}
            <Link to="/" className="flex flex-col items-center justify-center shrink-0 mt-1">
               <span className="text-2xl md:text-3xl font-black text-white tracking-tighter -mb-1" style={{ fontFamily: 'monospace' }}>
                ENTERTAIN
              </span>
              <span className="text-xs tracking-[0.3em] text-[#0063e5] font-bold">
                HUB+
              </span>
            </Link>
            
            <nav className="hidden md:flex items-center h-full text-sm">
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

          <div className="flex items-center gap-3 md:gap-5">
            {/* Search */}
            <div ref={searchRef} className={`flex items-center transition-all duration-300 border ${isSearchExpanded ? 'bg-black/60 border-gray-600 rounded-full px-3 py-1.5' : 'border-transparent'}`}>
              <button 
                onClick={() => setIsSearchExpanded(true)}
                className="text-white hover:text-gray-300 transition focus:outline-none"
              >
                <Search className="w-5 h-5" />
              </button>
              {isSearchExpanded && (
                <div className="relative flex items-center">
                  <input
                    autoFocus
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search by title, character, or genre"
                    className="bg-transparent border-none outline-none text-sm w-36 md:w-64 ml-2 placeholder:text-gray-400 text-white"
                  />
                  {query && (
                    <button onClick={() => setQuery('')} className="ml-1">
                      <X className="w-4 h-4 text-white" />
                    </button>
                  )}
                  {/* Results Dropdown */}
                  {query && (
                    <div className="absolute top-full mt-4 right-0 w-72 md:w-96 bg-[#0c1221] border border-[#1a1f33] rounded-lg shadow-2xl overflow-hidden z-[60]">
                      {isSearching ? (
                        <div className="p-4 text-gray-400 text-sm">Searching the galaxy...</div>
                      ) : results.length > 0 ? (
                        <div className="max-h-[70vh] overflow-y-auto">
                          {results.map(item => (
                            <Link 
                              key={item.external_id} 
                              to={`/content/${item.external_id}`}
                              onClick={() => { setQuery(''); setIsSearchExpanded(false); }}
                              className="flex items-center gap-3 p-3 hover:bg-white/10 transition-colors border-b border-[#1a1f33]"
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
            <div className="relative" ref={dropdownRef}>
              <button 
                className="p-2 text-white hover:text-gray-300 transition relative"
                onClick={() => setShowNotifications(!showNotifications)}
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-[#0063e5] text-white text-[10px] font-bold flex items-center justify-center rounded-full border border-[#040714]">
                    {unreadCount}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-4 w-72 md:w-96 bg-[#0c1221] border border-[#1a1f33] rounded-lg shadow-2xl z-[60]">
                  <div className="p-4 border-b border-[#1a1f33]">
                    <h3 className="font-bold text-sm tracking-wider uppercase text-gray-300">Notifications</h3>
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    {notifications.length > 0 ? (
                      notifications.slice(0, 10).map(notif => (
                        <div 
                          key={notif.id}
                          onClick={() => handleNotificationClick(notif.id)}
                          className={`flex gap-3 p-4 border-b border-[#1a1f33] cursor-pointer hover:bg-white/5 transition-colors ${!notif.is_read ? 'bg-white/5' : ''}`}
                        >
                          {notif.poster_url ? (
                            <img src={notif.poster_url} alt="" className="w-10 h-14 object-cover rounded shadow" />
                          ) : (
                            <div className="w-10 h-14 bg-[#1a1f33] rounded flex items-center justify-center">
                              <Bell className="w-4 h-4 text-gray-400" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                             <h4 className="font-bold text-xs truncate text-white">{notif.title}</h4>
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
            <Link to="/settings" className="p-2 text-white hover:text-gray-300 transition">
              <Settings className="w-5 h-5" />
            </Link>

            {/* Avatar */}
            <Link to="/profile" className="flex items-center justify-center relative cursor-pointer group ml-2">
               {avatarUrl ? (
                  <img src={avatarUrl} alt="Avatar" className="w-10 h-10 rounded-full shrink-0 object-cover border-[3px] border-transparent group-hover:border-white transition-all shadow-lg" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-10 h-10 rounded-full shrink-0 bg-gradient-to-tr from-[#0063e5] to-[#4db5ff] flex items-center justify-center text-white font-bold border-[3px] border-transparent group-hover:border-white transition-all shadow-lg text-sm">
                    {username[0]?.toUpperCase()}
                  </div>
                )}
            </Link>
          </div>
        </div>
      </header>
      
      {/* Content Area */}
      <main className="flex-1 w-full pb-20 relative z-10 pt-20">
        {children}
      </main>
    </div>
  );
}
