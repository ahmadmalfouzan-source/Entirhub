import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Bell, Settings, X, ChevronRight } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { useTranslation } from '@/hooks/useTranslation';
import { searchMedia, searchAnime, fetchGames, MediaItem } from '@/services/api';
import { checkAndCreateNotifications, getNotifications, markNotificationAsRead, Notification } from '@/services/notifications';
import { formatDistanceToNow } from 'date-fns';
import { Input } from '@/components/ui/input';

export function NetflixLayout({ children }: { children: React.ReactNode }) {
  const { user, avatarUrl } = useStore();
  const { t } = useTranslation();
  const navigate = useNavigate();
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

  return (
    <div className="flex flex-col min-h-screen bg-[#141414] text-white">
      {/* Netflix-style Top Nav Header */}
      <header className={`fixed top-0 z-50 w-full transition-colors duration-300 ${isScrolled ? 'bg-[#141414]' : 'bg-gradient-to-b from-black/80 to-transparent'}`}>
        <div className="flex items-center justify-between px-4 md:px-12 h-16 md:h-20">
          
          <div className="flex items-center gap-10">
            <Link to="/" className="flex items-center bg-transparent shrink-0">
               <span className="text-2xl md:text-3xl font-black text-[#E50914] tracking-tighter uppercase italic">
                EntertainHub
              </span>
            </Link>
            
            <nav className="hidden lg:flex items-center gap-5 text-sm">
              <Link to="/" className="text-white hover:text-gray-300 transition-colors font-medium">Home</Link>
              <Link to="/series" className="text-[#e5e5e5] hover:text-gray-300 transition-colors">Series</Link>
              <Link to="/movies" className="text-[#e5e5e5] hover:text-gray-300 transition-colors">Movies</Link>
              <Link to="/games" className="text-[#e5e5e5] hover:text-gray-300 transition-colors">Games</Link>
              <Link to="/library" className="text-[#e5e5e5] hover:text-gray-300 transition-colors">My Library</Link>
            </nav>
          </div>

          <div className="flex items-center gap-2 md:gap-5">
            {/* Search */}
            <div ref={searchRef} className={`flex items-center transition-all duration-300 border border-transparent ${isSearchExpanded ? 'bg-black/80 border-white px-2 py-1' : ''}`}>
              <button 
                onClick={() => setIsSearchExpanded(true)}
                className="text-white p-1 hover:text-gray-300 transition focus:outline-none"
              >
                <Search className="w-5 h-5" />
              </button>
              {isSearchExpanded && (
                <div className="relative">
                  <input
                    autoFocus
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Titles, people, genres"
                    className="bg-transparent border-none outline-none text-sm w-32 md:w-60 ml-2 placeholder:text-gray-500"
                  />
                  {query && (
                    <button onClick={() => setQuery('')} className="absolute right-0 top-1/2 -translate-y-1/2">
                      <X className="w-4 h-4 text-white" />
                    </button>
                  )}
                  {/* Results Dropdown */}
                  {query && (
                    <div className="absolute top-full mt-4 right-0 w-64 md:w-80 bg-[#141414] border border-gray-800 rounded shadow-2xl overflow-hidden z-[60]">
                      {isSearching ? (
                        <div className="p-4 text-gray-400 text-sm italic">Searching...</div>
                      ) : results.length > 0 ? (
                        <div className="max-h-[70vh] overflow-y-auto">
                          {results.map(item => (
                            <Link 
                              key={item.external_id} 
                              to={`/content/${item.external_id}`}
                              onClick={() => { setQuery(''); setIsSearchExpanded(false); }}
                              className="flex items-center gap-3 p-3 hover:bg-white/5 transition-colors border-b border-white/5"
                            >
                              <img src={item.poster_url} alt="" className="w-10 h-14 object-cover rounded shadow" />
                              <div className="min-w-0">
                                <div className="text-white font-medium text-sm truncate">{item.title}</div>
                                <div className="text-xs text-gray-500 capitalize">{item.media_type} • {item.release_date?.substring(0, 4)}</div>
                              </div>
                            </Link>
                          ))}
                        </div>
                      ) : (
                        <div className="p-4 text-gray-400 text-sm text-center">No matches found</div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Notifications */}
            <div className="relative" ref={dropdownRef}>
              <button 
                className="p-1.5 text-white hover:text-gray-300 transition relative"
                onClick={() => setShowNotifications(!showNotifications)}
              >
                <Bell className="w-6 h-6" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-[#E50914] text-white text-[10px] font-bold flex items-center justify-center rounded-sm">
                    {unreadCount}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-4 w-72 md:w-96 bg-[#141414]/95 border border-gray-800 rounded shadow-2xl z-[60] backdrop-blur-md">
                  <div className="p-4 border-b border-gray-800">
                    <h3 className="font-bold text-sm">Notifications</h3>
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    {notifications.length > 0 ? (
                      notifications.slice(0, 10).map(notif => (
                        <div 
                          key={notif.id}
                          onClick={() => handleNotificationClick(notif.id)}
                          className={`flex gap-3 p-4 border-b border-gray-800/50 cursor-pointer hover:bg-white/5 transition-colors ${!notif.is_read ? 'bg-white/5' : ''}`}
                        >
                          {notif.poster_url ? (
                            <img src={notif.poster_url} alt="" className="w-8 h-12 object-cover rounded" />
                          ) : (
                            <div className="w-8 h-12 bg-white/10 rounded flex items-center justify-center">
                              <Bell className="w-4 h-4 text-gray-500" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                             <h4 className="font-bold text-xs truncate">{notif.title}</h4>
                             <p className="text-[10px] text-gray-400 mt-1 line-clamp-2">{notif.message}</p>
                             <span className="text-[9px] text-gray-500 mt-1 block">
                                {formatDistanceToNow(new Date(notif.created_at || new Date()), { addSuffix: true })}
                             </span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-8 text-center text-gray-500 text-sm">No new notifications</div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Settings */}
            <Link to="/settings" className="p-1.5 text-white hover:text-gray-300 transition">
              <Settings className="w-6 h-6" />
            </Link>

            {/* Avatar */}
            <Link to="/profile" className="flex items-center justify-center relative cursor-pointer group ml-1">
               {avatarUrl ? (
                  <img src={avatarUrl} alt="Avatar" className="w-8 h-8 rounded shrink-0 object-cover border-2 border-transparent group-hover:border-white transition-all shadow-lg" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-8 h-8 rounded shrink-0 bg-[#E50914] flex items-center justify-center text-white font-bold border-2 border-transparent group-hover:border-white transition-all shadow-lg text-xs">
                    {username[0]?.toUpperCase()}
                  </div>
                )}
            </Link>
          </div>
        </div>
      </header>
      
      {/* Content Area */}
      <main className="flex-1 w-full pb-20">
        <div className="relative">
          {children}
        </div>
      </main>
    </div>
  );
}
