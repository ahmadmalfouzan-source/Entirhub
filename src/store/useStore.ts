import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import { Session, User } from '@supabase/supabase-js';
import * as libraryService from '@/services/library';
import { logActivity } from '@/services/activityService';

export interface WatchlistItem {
  id: string;
  status: 'planned' | 'watching' | 'completed' | 'dropped' | 'on_hold' | 'replay' | 'watch_tonight';
  rating?: number;
  media_id: string;
  added_at: string;
  rewatch_count?: number;
  platform?: string;
  hours_played?: number;
  is_completed_100?: boolean;
  media: {
    title: string;
    poster_url: string;
    media_type: 'movie' | 'series' | 'game';
    rating_global: number;
    external_id?: string;
    release_date?: string;
    genres?: string[];
  };
}

interface StoreState {
  session: Session | null;
  user: User | null;
  isAdmin: boolean;
  psnUsername: string | null;
  watchlist: WatchlistItem[];
  setSession: (session: Session | null) => void;
  fetchWatchlist: () => Promise<void>;
  fetchProfile: () => Promise<void>;
  addToWatchlist: (media: any) => Promise<void>;
  updateWatchlistItem: (id: string, updates: any) => Promise<void>;
  incrementRewatch: (id: string, currentCount: number) => Promise<void>;
  updatePlatform: (id: string, platform: string) => Promise<void>;
  updateHoursPlayed: (id: string, hours: number) => Promise<void>;
  toggle100Completion: (id: string, isCompleted: boolean) => Promise<void>;
  removeFromWatchlist: (id: string) => Promise<void>;
  logout: () => Promise<void>;
}

export const useStore = create<StoreState>((set, get) => ({
  session: null,
  user: null,
  isAdmin: false,
  psnUsername: null,
  watchlist: [],
  setSession: (session) => {
    set({ session, user: session?.user || null });
    if (session?.user) {
      get().fetchProfile();
    } else {
      set({ isAdmin: false, psnUsername: null });
    }
  },
  fetchProfile: async () => {
    try {
      const user = get().user;
      if (!user) return;
      
      const { data, error } = await supabase
        .from('profiles')
        .select('is_admin, psn_username')
        .eq('id', user.id)
        .single();
        
      if (!error && data) {
        set({ 
          isAdmin: !!data.is_admin,
          psnUsername: data.psn_username || null
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  },
  fetchWatchlist: async () => {
    try {
      console.log('[Store] Fetching watchlist...');
      // 1. Get current session
      const { data: { session }, error: authError } = await supabase.auth.getSession();
      
      if (authError) throw authError;
      
      if (!session) {
        console.log('[Store] No active session, clearing watchlist');
        set({ watchlist: [] });
        return;
      }

      // 2. Fetch library data using the session's user ID
      const { data, error } = await supabase
        .from('user_library')
        .select('*, media(*)')
        .eq('user_id', session.user.id);
      
      if (error) {
        console.error('[Store] Supabase error in fetchWatchlist:', error);
        throw error;
      }
      
      console.log('[Store] Library data received:', data?.length, 'items');
      set({ watchlist: data as any || [] });
    } catch (error) {
      console.error('[Store] Critical error in fetchWatchlist:', error);
    }
  },
  addToWatchlist: async (media) => {
    try {
      await libraryService.addToLibrary({
        external_id: media.external_id || media.id,
        media_type: media.media_type || media.type,
        title: media.title,
        poster_url: media.cover_url || media.poster_url,
        rating_global: media.rating,
        release_date: media.release_date,
        genres: media.genres,
        source: media.source || (media.id?.startsWith('rawg_') ? 'rawg' : 'tmdb')
      });
      await logActivity('added', media.id);
      await get().fetchWatchlist();
    } catch (error) {
      console.error('Error adding to library:', error);
    }
  },
  updateWatchlistItem: async (id, updates) => {
    try {
      if (updates.status) {
        await libraryService.updateStatus(id, updates.status);
        const activityTypeMap: Record<string, string> = {
          'completed': 'completed',
          'watching': 'started',
          'dropped': 'dropped'
        };
        if (activityTypeMap[updates.status]) {
          await logActivity(activityTypeMap[updates.status] as any, id);
        }
      }
      if (updates.rating !== undefined) {
        await libraryService.rateMedia(id, updates.rating);
        await logActivity('rated', id, { rating: updates.rating });
      }
      await get().fetchWatchlist();
    } catch (error) {
      console.error('Error updating library item:', error);
    }
  },
  incrementRewatch: async (id, currentCount) => {
    try {
      await libraryService.incrementRewatch(id, currentCount);
      await get().fetchWatchlist();
    } catch (error) {
      console.error('Error incrementing rewatch:', error);
    }
  },
  updatePlatform: async (id, platform) => {
    try {
      await libraryService.updatePlatform(id, platform);
      await get().fetchWatchlist();
    } catch (error) {
      console.error('Error updating platform:', error);
    }
  },
  updateHoursPlayed: async (id, hours) => {
    try {
      await libraryService.updateHoursPlayed(id, hours);
      await get().fetchWatchlist();
    } catch (error) {
      console.error('Error updating hours played:', error);
    }
  },
  toggle100Completion: async (id, isCompleted) => {
    try {
      await libraryService.toggle100Completion(id, isCompleted);
      await get().fetchWatchlist();
    } catch (error) {
      console.error('Error toggling 100% completion:', error);
    }
  },
  removeFromWatchlist: async (id) => {
    try {
      const { error } = await supabase
        .from('user_library')
        .delete()
        .eq('id', id);
      if (error) throw error;
      set({ watchlist: get().watchlist.filter((item) => item.id !== id) });
    } catch (error) {
      console.error('Error removing from library:', error);
    }
  },
  logout: async () => {
    await supabase.auth.signOut();
    set({ session: null, user: null, watchlist: [] });
  },
}));

