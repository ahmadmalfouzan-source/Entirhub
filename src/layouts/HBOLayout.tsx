import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Search, Bell, Settings, X, Plus, Menu, Home, Tv, Film, Gamepad2, List } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { useTranslation } from '@/hooks/useTranslation';
import { searchMedia, searchAnime, fetchGames, MediaItem } from '@/services/api';
import { checkAndCreateNotifications, getNotifications, markNotificationAsRead, Notification } from '@/services/notifications';
import { formatDistanceToNow } from 'date-fns';

export function HBOLayout({ children }: { children: React.ReactNode }) {
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
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

  // HBO Active Link styling
  const isActive = (path: string) => location.pathname === path;
  const navLinkStyle = (path: string) => `relative flex items-center h-full px-2 lg:px-5 text-[#e6e6e6] text-sm lg:text-base font-semibold tracking-wide transition-all hover:text-white ${
    isActive(path) ? 'text-white after:content-[""] after:absolute after:bottom-[-20px] after:left-0 after:right-0 after:h-[2px] after:bg-[#8b00ff] after:shadow-[0_-1px_8px_rgba(139,0,255,0.8)]' : ''
  }`;

  return (
    <div className="flex flex-col min-h-screen text-white relative bg-[#0d0d0d] font-sans">
      {/* Subtle Purple Gradient Overlay */}
      <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(circle_at_top_right,rgba(139,0,255,0.08),transparent_50%)] z-0" />
      <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(circle_at_bottom_left,rgba(139,0,255,0.05),transparent_40%)] z-0" />
      
      {/* HBO style Top Nav Header */}
      <header className={`fixed top-0 z-50 w-full h-16 md:h-20 transition-all duration-300 ${isScrolled ? 'bg-[#0d0d0d] shadow-[0_1px_0_0_rgba(139,0,255,0.3)]' : 'bg-transparent border-b border-[#8b00ff]/20'}`}>
        <div className="flex items-center justify-between px-2 sm:px-6 md:px-16 h-full backdrop-blur-sm">
          
          <div className="flex items-center h-full flex-1">
            {/* Mobile Menu Toggle */}
            <button 
              className="lg:hidden p-2 text-[#8b00ff] transition-colors focus:outline-none min-h-[44px] min-w-[44px] flex items-center justify-center mr-1"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>

            {/* Logo */}
            <Link to="/" className="flex items-center justify-center shrink-0 mr-4 md:mr-12 text-[#8b00ff] group">
              <div className="w-8 h-8 md:w-10 md:h-10 border-[3px] border-[#8b00ff] rounded-full flex items-center justify-center mr-1 md:mr-2 shadow-[0_0_10px_rgba(139,0,255,0.3)] group-hover:shadow-[0_0_15px_rgba(139,0,255,0.6)] transition-all">
                <div className="w-3 h-3 md:w-4 md:h-4 bg-[#8b00ff] rounded-full shrink-0" />
              </div>
              <span className="text-xl md:text-2xl font-black tracking-tight uppercase group-hover:text-white transition-colors" style={{ fontFamily: 'Georgia, serif' }}>
                Entertain<span className="text-white group-hover:text-[#8b00ff] transition-colors">Max</span>
              </span>
            </Link>
            
            <nav className="hidden lg:flex items-center h-full text-base">
              <Link to="/" className={navLinkStyle('/')}>Home</Link>
              <Link to="/series" className={navLinkStyle('/series')}>Series</Link>
              <Link to="/movies" className={navLinkStyle('/movies')}>Movies</Link>
              <Link to="/games" className={navLinkStyle('/games')}>Originals</Link>
              <Link to="/library" className={navLinkStyle('/library')}>My Stuff</Link>
            </nav>
          </div>

          <div className="flex items-center gap-2 md:gap-6">
            {/* Search */}
            <div ref={searchRef} className={`flex items-center transition-all duration-300 border-b-2 ${isSearchExpanded ? 'border-[#8b00ff] bg-[#1a1a1a] rounded-t-md px-2 md:px-4 py-1 md:py-2' : 'border-transparent'}`}>
              <button 
                onClick={() => setIsSearchExpanded(true)}
                className="text-gray-300 hover:text-[#8b00ff] transition-colors focus:outline-none min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                <Search className="w-5 h-5 md:w-6 md:h-6" />
              </button>
              {isSearchExpanded && (
                <div className="absolute top-16 left-0 right-0 px-4 bg-[#0d0d0d] py-3 md:py-0 md:bg-transparent md:relative md:top-0 md:px-0 flex items-center shadow-lg md:shadow-none border-b border-[#8b00ff]/20 md:border-none z-50">
                   <input
                    autoFocus
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search characters or shows"
                    className="bg-transparent border-none outline-none text-sm w-full md:w-64 md:ml-3 placeholder:text-gray-500 font-medium text-white"
                  />
                  {query && (
                    <button onClick={() => setQuery('')} className="absolute right-6 top-1/2 -translate-y-1/2 md:right-0 md:relative min-h-[44px] min-w-[44px] flex items-center justify-center md:ml-2 hover:text-[#8b00ff] transition">
                      <X className="w-5 h-5 md:w-4 md:h-4 text-white" />
                    </button>
                  )}
                  {/* Results Dropdown */}
                  {query && (
                    <div className="absolute top-full mt-0 md:mt-2 left-0 right-0 md:left-auto md:right-0 md:-mr-4 w-full md:w-[400px] bg-[#1a1a1a] border-t md:border border-[#333] rounded-b-md md:rounded-b-lg shadow-[0_10px_40px_rgba(0,0,0,0.8)] overflow-hidden z-[60] border-t-[#8b00ff] md:border-t-2">
                       {isSearching ? (
                        <div className="p-6 text-gray-400 text-sm italic font-serif">Scanning catalog...</div>
                      ) : results.length > 0 ? (
                        <div className="max-h-[70vh] overflow-y-auto custom-scrollbar">
                          {results.map(item => (
                            <Link 
                              key={item.external_id} 
                              to={`/content/${item.external_id}`}
                              onClick={() => { setQuery(''); setIsSearchExpanded(false); }}
                              className="flex items-center gap-4 p-4 hover:bg-[#8b00ff]/10 transition-colors border-b border-[#333] min-h-[60px]"
                            >
                              <img src={item.poster_url} alt="" className="w-14 h-20 object-cover rounded shadow border border-[#333]" />
                              <div className="min-w-0">
                                <div className="text-white font-bold text-lg truncate mb-1">{item.title}</div>
                                <div className="text-sm text-[#8b00ff] font-medium capitalize flex gap-2 items-center">
                                  {item.media_type} 
                                  <span className="w-1 h-1 bg-gray-500 rounded-full" /> 
                                  <span className="text-gray-400">{item.release_date?.substring(0, 4)}</span>
                                </div>
                              </div>
                            </Link>
                          ))}
                        </div>
                      ) : (
                        <div className="p-6 text-gray-400 text-center font-medium">No titles found</div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Notifications */}
            <div className="relative hidden sm:block" ref={dropdownRef}>
              <button 
                className="p-2 text-gray-300 hover:text-[#8b00ff] transition-colors relative min-h-[44px] min-w-[44px] flex items-center justify-center"
                onClick={() => setShowNotifications(!showNotifications)}
              >
                <Bell className="w-5 h-5 md:w-6 h-6" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-2 w-2.5 h-2.5 bg-[#8b00ff] flex items-center justify-center rounded-full border border-[#0d0d0d]" />
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-6 w-80 md:w-96 bg-[#1a1a1a] border border-[#333] shadow-2xl z-[60] border-t-4 border-t-[#8b00ff] rounded-b-md">
                  <div className="p-5 border-b border-[#333] flex justify-between items-center">
                    <h3 className="font-bold text-lg text-white">Notifications</h3>
                    <span className="text-xs font-bold text-gray-500 bg-[#333] px-2 py-1 rounded">{unreadCount} New</span>
                  </div>
                  <div className="max-h-[50vh] overflow-y-auto">
                    {notifications.length > 0 ? (
                      notifications.slice(0, 10).map(notif => (
                        <div 
                          key={notif.id}
                          onClick={() => handleNotificationClick(notif.id)}
                          className={`flex gap-4 p-5 border-b border-[#333] cursor-pointer hover:bg-[#2a2a2a] transition-colors min-h-[72px] ${!notif.is_read ? 'bg-[#8b00ff]/5' : ''}`}
                        >
                          {notif.poster_url ? (
                            <img src={notif.poster_url} alt="" className="w-12 h-16 object-cover rounded border border-[#444]" />
                          ) : (
                            <div className="w-12 h-16 bg-[#333] rounded flex items-center justify-center border border-[#444]">
                               <Bell className="w-5 h-5 text-gray-400" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                             <div className="flex items-start justify-between">
                               <h4 className="font-bold text-sm truncate text-white mb-1">{notif.title}</h4>
                               {!notif.is_read && <div className="w-2 h-2 bg-[#8b00ff] rounded-full shrink-0 mt-1" />}
                             </div>
                             <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">{notif.message}</p>
                             <span className="text-[11px] text-[#8b00ff] mt-2 block font-medium">
                                {formatDistanceToNow(new Date(notif.created_at || new Date()), { addSuffix: true })}
                             </span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-10 text-center text-gray-500 font-medium">You're all caught up!</div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Settings */}
            <Link to="/settings" className="p-2 text-gray-300 hover:text-[#8b00ff] transition-colors hidden sm:flex items-center justify-center min-h-[44px] min-w-[44px]">
              <Settings className="w-5 h-5 md:w-6 md:h-6" />
            </Link>

            {/* Avatar */}
            <Link to="/profile" className="flex items-center justify-center relative cursor-pointer group ml-1 md:ml-2 min-h-[44px] min-w-[44px]">
               {avatarUrl ? (
                  <img src={avatarUrl} alt="Avatar" className="w-8 h-8 md:w-11 md:h-11 rounded-full shrink-0 object-cover border-2 border-transparent group-hover:border-[#8b00ff] transition-all" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-8 h-8 md:w-11 md:h-11 rounded-full shrink-0 bg-[#333] flex items-center justify-center text-white font-bold border-2 border-transparent group-hover:border-[#8b00ff] transition-all text-xs md:text-base">
                    {username[0]?.toUpperCase()}
                  </div>
                )}
            </Link>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {isMobileMenuOpen && (
          <div className="lg:hidden absolute top-16 left-0 right-0 bg-[#0d0d0d] border-b border-[#8b00ff]/20 shadow-xl overflow-hidden animate-in slide-in-from-top-4 duration-200 z-[40]">
            <nav className="flex flex-col py-2">
              <Link to="/" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-4 px-6 py-4 text-base font-semibold text-white hover:bg-[#8b00ff]/10 hover:text-[#8b00ff] transition-all tracking-wide">
                <Home className="w-5 h-5" /> Home
              </Link>
              <Link to="/series" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-4 px-6 py-4 text-base font-semibold text-[#e6e6e6] hover:bg-[#8b00ff]/10 hover:text-[#8b00ff] transition-all tracking-wide">
                <Tv className="w-5 h-5" /> Series
              </Link>
              <Link to="/movies" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-4 px-6 py-4 text-base font-semibold text-[#e6e6e6] hover:bg-[#8b00ff]/10 hover:text-[#8b00ff] transition-all tracking-wide">
                <Film className="w-5 h-5" /> Movies
              </Link>
              <Link to="/games" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-4 px-6 py-4 text-base font-semibold text-[#e6e6e6] hover:bg-[#8b00ff]/10 hover:text-[#8b00ff] transition-all tracking-wide">
                <Gamepad2 className="w-5 h-5" /> Originals
              </Link>
              <Link to="/library" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-4 px-6 py-4 text-base font-semibold text-[#e6e6e6] hover:bg-[#8b00ff]/10 hover:text-[#8b00ff] transition-all tracking-wide">
                <List className="w-5 h-5" /> My Stuff
              </Link>
              {/* Mobile-only tools down lower for reachability */}
               <div className="h-px bg-[#8b00ff]/20 my-2 mx-4" />
               <Link to="/settings" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-4 px-6 py-4 text-base font-semibold text-[#e6e6e6] hover:bg-[#8b00ff]/10 hover:text-[#8b00ff] transition-all sm:hidden tracking-wide">
                <Settings className="w-5 h-5" /> Settings
              </Link>
               <button onClick={() => { setIsMobileMenuOpen(false); setShowNotifications(true); }} className="flex items-center gap-4 px-6 py-4 text-base font-semibold text-[#e6e6e6] hover:bg-[#8b00ff]/10 hover:text-[#8b00ff] transition-all sm:hidden w-full text-left tracking-wide">
                <div className="relative">
                  <Bell className="w-5 h-5" />
                   {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-[#8b00ff] rounded-full" />
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
        <div className="relative">
          {children}
        </div>
      </main>
    </div>
  );
}
