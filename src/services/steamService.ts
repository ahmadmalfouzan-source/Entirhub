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
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    console.warn('[Steam] Supabase configuration missing');
    return [];
  }

  const authHeaders = {
    'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
    'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY
  };

  try {
    // 1. Search for game on Steam via Supabase Proxy
    const searchUrl = `${supabaseUrl}/functions/v1/steam-proxy?q=${encodeURIComponent(gameName)}`;
    const searchRes = await fetch(searchUrl, { headers: authHeaders }).catch(() => null);
    
    if (!searchRes || !searchRes.ok) {
      console.warn('[Steam] Search via proxy failed');
      return [];
    }
    
    const searchData = await searchRes.json();
    if (!searchData?.items || searchData.items.length === 0) {
      console.warn('[Steam] No app found for:', gameName);
      return [];
    }

    const appid = searchData.items[0].id;
    console.log('[Steam] Found AppID:', appid);

    // 2. Fetch schema via Supabase Proxy
    const schemaUrl = `${supabaseUrl}/functions/v1/steam-proxy?appid=${appid}`;
    const schemaRes = await fetch(schemaUrl, { headers: authHeaders }).catch(() => null);
    
    if (!schemaRes || !schemaRes.ok) {
      console.warn('[Steam] Schema fetch via proxy failed');
      return [];
    }
    
    const schemaData = await schemaRes.json();
    if (!schemaData?.game?.availableGameStats?.achievements) {
      console.warn('[Steam] No achievements found in schema');
      return [];
    }

    const achievements = schemaData.game.availableGameStats.achievements;

    // 3. Fetch global percentages (Can use direct proxy as it doesn't need key, or just search proxy)
    // For simplicity, we'll try percentages via the existing internal proxy if available
    let percentages: any[] = [];
    try {
      const pctUrl = `https://api.steampowered.com/ISteamUserStats/GetGlobalAchievementPercentagesForApp/v2/?gameid=${appid}`;
      const internalProxy = (url: string) => `/api/steam?url=${encodeURIComponent(url)}`;
      const pctRes = await fetch(internalProxy(pctUrl)).catch(() => null);
      if (pctRes && pctRes.ok) {
        const pctData = await pctRes.json();
        percentages = pctData.achievementpercentages?.achievements || [];
      }
    } catch (e) {
      console.warn("[Steam] Percentages fetch failed:", e);
    }
    
    // Merge data
    const result: SteamAchievement[] = achievements.map((ach: any) => {
      const pctObj = percentages.find((p: any) => p.name === ach.name);
      return {
        ...ach,
        percent: pctObj ? parseFloat(pctObj.percent) : 0,
      };
    });

    result.sort((a, b) => a.percent - b.percent);
    return result;

  } catch (err: any) {
    console.error('[Steam] Service error:', err.message);
    return [];
  }
};
