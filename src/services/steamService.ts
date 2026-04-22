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

const STEAM_API_KEY = import.meta.env.VITE_STEAM_API_KEY;

export const getSteamAppId = async (gameName: string): Promise<number | null> => {
  try {
    const targetUrl = `https://store.steampowered.com/api/storesearch/?term=${encodeURIComponent(gameName)}&l=english&cc=US`;
    const searchUrl = `/api/steam?url=${encodeURIComponent(targetUrl)}`;
    console.log('[SteamAppId] Searching for:', gameName);
    
    // Fallback to catching network errors like TypeError: Failed to fetch
    const searchRes = await fetch(searchUrl).catch(() => null);
    
    if (!searchRes || !searchRes.ok) {
      console.error('[SteamAppId] Search request failed');
      return null;
    }
    
    const searchData = await searchRes.json();
    
    if (!searchData?.items || searchData.items.length === 0) return null;

    return searchData.items[0].id;
  } catch (err) {
    return null;
  }
};

export const getSteamAchievements = async (gameName: string): Promise<SteamAchievement[]> => {
  const cacheKey = `steam_achievements_${gameName.toLowerCase().trim()}`;
  
  return getCacheOrFetch(cacheKey, async () => {
    if (!STEAM_API_KEY) {
      console.warn('Steam API Key is missing. Trophies disabled.');
      return [];
    }

    const appid = await getSteamAppId(gameName);
    if (!appid) return [];

    // 2. Fetch schema via local Proxy
    const targetSchemaUrl = `https://api.steampowered.com/ISteamUserStats/GetSchemaForGame/v2/?key=${STEAM_API_KEY}&appid=${appid}`;
    const schemaUrl = `/api/steam?url=${encodeURIComponent(targetSchemaUrl)}`;
    
    const schemaRes = await fetch(schemaUrl).catch(() => null);
    
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
      const targetPctUrl = `https://api.steampowered.com/ISteamUserStats/GetGlobalAchievementPercentagesForApp/v0002/?gameid=${appid}`;
      const pctUrl = `/api/steam?url=${encodeURIComponent(targetPctUrl)}`;
      const pctRes = await fetch(pctUrl).catch(() => null);
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

    result.sort((a, b) => (b.percent || 0) - (a.percent || 0)); // Descending by rarity if wanted, or ascending
    return result.sort((a, b) => a.percent - b.percent); // original: mostly rare first
  }, { expiresInHours: 0, fallbackOnError: true }).catch(() => []);
};
