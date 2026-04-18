import { supabase } from '@/lib/supabase';
import { useStore } from '@/store/useStore';
import { fetchGames } from '@/services/api';

export interface PSNTrophy {
  id: string;
  title: string;
  description: string;
  type: 'bronze' | 'silver' | 'gold' | 'platinum';
  earned: boolean;
  earnedAt?: string;
}

export interface PSNGame {
  id: string;
  title: string;
  imageUrl: string;
  platform: string;
  trophies: PSNTrophy[];
  platinumEarned: boolean;
  progress: number;
}

export async function fetchPSNProfile(username: string) {
  // Strategy A: Trophy-based endpoint
  try {
    const url = `https://psn-api.achievements.app/v1/users/${username}/trophyTitles`;
    console.log(`Fetching PSN trophy titles from: ${url}`);
    const response = await fetch(url).catch(() => null);
    
    if (response && response.ok) {
      const data = await response.json();
      const titles = data.trophyTitles || data.titles || data.data || [];
      if (titles.length > 0) {
        console.log(`Successfully fetched ${titles.length} titles via Strategy A`);
        return { trophyTitles: titles, strategy: 'A' };
      }
    }
    console.warn('Strategy A failed or returned no data');
  } catch (error) {
    console.error('Strategy A error:', error);
  }

  // Strategy B: Fallback/Simulation (returning empty, UI will handle)
  console.log('Strategy B: Fallback mode activated');
  return { trophyTitles: [], strategy: 'B' };
}

function cleanGameTitle(title: string): string {
  return title
    .replace(/\s*\(.*?\)\s*/g, '')
    .replace(/Trophies|Standard Edition|PS5|PS4|Edition|Remastered/gi, '')
    .trim();
}

export async function syncPSNGamesToLibrary(username: string, userId: string, onProgress?: (current: number, total: number, status: string) => void) {
  try {
    if (onProgress) onProgress(0, 0, 'Fetching trophies...');
    const psnData = await fetchPSNProfile(username);
    
    if (psnData.strategy === 'B' || !psnData.trophyTitles || psnData.trophyTitles.length === 0) {
      if (onProgress) onProgress(0, 0, 'Fallback mode activated');
      return { strategy: 'B' };
    }

    const titles = psnData.trophyTitles;
    const total = titles.length;
    
    for (let i = 0; i < titles.length; i++) {
      const titleData = titles[i];
      if (onProgress) onProgress(i + 1, total, 'Syncing...');
      
      const rawTitle = titleData.trophyTitleName || titleData.title || 'Unknown Game';
      const cleanTitle = cleanGameTitle(rawTitle);
      
      let rawgGame = null;
      try {
        const rawgGames = await fetchGames(cleanTitle);
        rawgGame = rawgGames && rawgGames.length > 0 ? rawgGames[0] : null;
      } catch (e) {
        console.warn(`RAWG search failed for ${cleanTitle}`);
      }
      
      const externalId = titleData.npCommunicationId || rawTitle;
      
      // 1. Ensure media exists
      let { data: mediaData } = await supabase
        .from('media')
        .select('id')
        .or(`external_id.eq.${externalId},title.eq.${rawTitle}`)
        .maybeSingle();

      if (!mediaData) {
        const { data: newMedia } = await supabase
          .from('media')
          .insert({
            external_id: externalId,
            media_type: 'game',
            title: rawTitle,
            poster_url: rawgGame?.poster_url || titleData.trophyTitleIconUrl || '',
            description: rawgGame?.description || '',
            genres: rawgGame?.genres || [],
            rating_global: rawgGame?.rating || 0,
            source: 'psn'
          })
          .select('id')
          .single();
          
        mediaData = newMedia;
      }

      if (mediaData) {
        // 2. Check if already in library
        const { data: existing } = await supabase
          .from('user_library')
          .select('id')
          .eq('user_id', userId)
          .eq('media_id', mediaData.id)
          .maybeSingle();

        if (!existing) {
          await supabase
            .from('user_library')
            .insert({
              user_id: userId,
              media_id: mediaData.id,
              status: 'completed',
              platform: titleData.platform || 'PlayStation'
            });
        }
      }
    }
    
    return { strategy: 'A' };
  } catch (error) {
    console.error('Error syncing PSN games:', error);
    return { strategy: 'B', error };
  }
}
