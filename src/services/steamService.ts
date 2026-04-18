import { supabase } from '@/lib/supabase';

export interface SteamAchievement {
  name: string;
  defaultvalue: number;
  displayName: string;
  hidden: number;
  description: string;
  icon: string;
  icongray: string;
  percent: number;
}

export const getSteamAchievements = async (gameName: string): Promise<SteamAchievement[]> => {
  // Using local backend proxy for search (which doesn't need API keys)
  const localProxy = (url: string) => `/api/steam?url=${encodeURIComponent(url)}`;

  try {
    // 1. Search for game
    const searchUrl = localProxy(`https://store.steampowered.com/api/storesearch/?term=${encodeURIComponent(gameName)}&l=english&cc=US`);
    console.log('Fetching Steam search:', searchUrl);
    const searchRes = await fetch(searchUrl);
    if (!searchRes.ok) throw new Error(`Search failed: ${searchRes.status} ${searchRes.statusText}`);
    const searchData = await searchRes.json();
    console.log('Steam search data:', searchData);

    if (!searchData.items || searchData.items.length === 0) {
      console.warn('No Steam app found for:', gameName);
      return [];
    }

    const appid = searchData.items[0].id;
    console.log('Found Steam AppID:', appid);

    // 2. Fetch schema via Supabase Edge Function (hides API Key and bypasses CORS)
    console.log('Fetching Steam schema via Supabase Edge Function...');
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase configuration is missing');
    }

    const schemaUrl = `${supabaseUrl}/functions/v1/steam-proxy?appid=${appid}`;
    const schemaRes = await fetch(schemaUrl, {
      method: 'GET',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`
      }
    });
    
    if (!schemaRes.ok) {
      const errorData = await schemaRes.json().catch(() => ({}));
      throw new Error(`Schema fetch failed: ${errorData.error || schemaRes.statusText}`);
    }
    
    const schemaData = await schemaRes.json();
    console.log('Steam schema data:', schemaData);

    if (!schemaData.game || !schemaData.game.availableGameStats || !schemaData.game.availableGameStats.achievements) {
      console.warn('No achievements in schema for:', appid);
      return [];
    }

    const achievements = schemaData.game.availableGameStats.achievements;
    console.log('Achievements count:', achievements.length);

    // 3. Fetch global percentages (Using local proxy as it doesn't need API key)
    let percentages: any[] = [];
    try {
      const pctUrl = localProxy(`https://api.steampowered.com/ISteamUserStats/GetGlobalAchievementPercentagesForApp/v2/?gameid=${appid}`);
      console.log('Fetching Steam percentages:', pctUrl);
      const pctRes = await fetch(pctUrl);
      if (pctRes.ok) {
        const pctData = await pctRes.json();
        percentages = pctData.achievementpercentages?.achievements || [];
      } else {
        console.warn('Failed to fetch percentages, status:', pctRes.status);
      }
    } catch (e) {
      console.warn("Failed to fetch achievement percentages:", e);
    }
    
    // Merge
    const result: SteamAchievement[] = achievements.map((ach: any) => {
      const pctObj = percentages.find((p: any) => p.name === ach.name);
      return {
        ...ach,
        // Ensure percent is a number
        percent: pctObj ? parseFloat(pctObj.percent) : 0,
      };
    });

    // Sort by rarity (lowest percent = rarest)
    result.sort((a, b) => a.percent - b.percent);

    return result;

  } catch (err: any) {
    console.error('Failed to fetch Steam achievements:', err.message);
    throw err;
  }
};
