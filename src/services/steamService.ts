import { getCacheOrFetch } from './cacheService';

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

export const getSteamAppId = async (gameName: string): Promise<number | null> => {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey) return null;

  const authHeaders = {
    'Authorization': `Bearer ${supabaseKey}`,
    'apikey': supabaseKey
  };

  try {
    const searchUrl = `${supabaseUrl}/functions/v1/steam-proxy?q=${encodeURIComponent(gameName)}`;
    console.log('[SteamAppId] Searching for:', gameName);
    console.log('[SteamAppId] Search URL:', searchUrl);
    
    const searchRes = await fetch(searchUrl, { headers: authHeaders }).catch(() => null);
    
    if (!searchRes || !searchRes.ok) {
      console.error('[SteamAppId] Search request failed');
      return null;
    }
    
    const searchData = await searchRes.json();
    console.log('[SteamAppId] Results:', searchData);
    
    if (!searchData?.items || searchData.items.length === 0) return null;

    return searchData.items[0].id;
  } catch (err) {
    return null;
  }
};

export const getSteamAchievements = async (gameName: string): Promise<SteamAchievement[]> => {
  const cacheKey = `steam_achievements_${gameName.toLowerCase().trim()}`;
  
  return getCacheOrFetch(cacheKey, async () => {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase configuration missing');
    }

    const authHeaders = {
      'Authorization': `Bearer ${supabaseKey}`,
      'apikey': supabaseKey
    };

    const appid = await getSteamAppId(gameName);
    if (!appid) return [];

    // 2. Fetch schema via Supabase Proxy
    const schemaUrl = `${supabaseUrl}/functions/v1/steam-proxy?appid=${appid}`;
    const schemaRes = await fetch(schemaUrl, { headers: authHeaders }).catch(() => null);
    
    if (!schemaRes || !schemaRes.ok) {
      throw new Error('Schema fetch via proxy failed');
    }
    
    const schemaData = await schemaRes.json();
    if (!schemaData?.game?.availableGameStats?.achievements) {
      return [];
    }

    const achievements = schemaData.game.availableGameStats.achievements;

    let percentages: any[] = [];
    try {
      const pctUrl = `${supabaseUrl}/functions/v1/steam-proxy?type=percentages&appid=${appid}`;
      const pctRes = await fetch(pctUrl, { headers: authHeaders }).catch(() => null);
      if (pctRes && pctRes.ok) {
        const pctData = await pctRes.json();
        percentages = pctData.achievementpercentages?.achievements || [];
      }
    } catch (e) {
      console.warn("[Steam] Percentages fetch failed but continuing...");
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
  }, { expiresInHours: 0, fallbackOnError: true }).catch(() => []); // 0 for "no expiry"
};
