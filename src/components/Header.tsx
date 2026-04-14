import { useState, useEffect } from 'react';
import { Search, Bell, Sun, Moon } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { Input } from '@/components/ui/input';
import { searchMedia, searchAnime, MediaItem } from '@/services/api';
import { Link } from 'react-router-dom';

export function Header() {
  const { user } = useStore();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<MediaItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    return (localStorage.getItem('theme') as 'dark' | 'light') || 'dark';
  });

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

  return (
    <header className="h-20 px-8 flex items-center justify-between bg-card/80 backdrop-blur-md sticky top-0 z-50 border-b border-border">
      <div className="flex-1 max-w-xl relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <Input 
          placeholder="Search movies, series, anime..." 
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full pl-10 bg-white/5 border-none text-foreground placeholder:text-muted-foreground rounded-full h-12 focus-visible:ring-1 focus-visible:ring-primary"
        />
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

      <div className="flex items-center gap-6 ml-8">
        <button 
          onClick={toggleTheme}
          className="p-2 rounded-full hover:bg-white/10 text-muted-foreground hover:text-foreground transition-colors"
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {theme === 'dark' ? <Sun className="w-6 h-6" /> : <Moon className="w-6 h-6" />}
        </button>

        <button className="relative text-muted-foreground hover:text-foreground transition-colors">
          <Bell className="w-6 h-6" />
          <span className="absolute top-0 right-0 w-2 h-2 bg-primary rounded-full"></span>
        </button>
        
        <div className="flex items-center gap-3">
          <div className="text-right hidden md:block">
            <div className="text-sm font-medium text-foreground">{user?.email?.split('@')[0] || 'Guest'}</div>
            <div className="text-xs text-muted-foreground">Free Plan</div>
          </div>
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold uppercase">
            {user?.email?.[0] || 'G'}
          </div>
        </div>
      </div>
    </header>
  );
}
