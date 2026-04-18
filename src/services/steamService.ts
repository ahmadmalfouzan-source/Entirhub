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
  const apiKey = import.meta.env.VITE_STEAM_API_KEY;
  if (!apiKey) {
    console.error('VITE_STEAM_API_KEY is not set');
    return [];
  }
  console.log('API Key present:', apiKey.length > 5 ? `${apiKey.substring(0, 5)}...` : 'too short');

  // Using local backend proxy to bypass CORS
  const proxy = (url: string) => `/api/steam?url=${encodeURIComponent(url)}`;

  try {
    // 1. Search for game
    const searchUrl = proxy(`https://store.steampowered.com/api/storesearch/?term=${encodeURIComponent(gameName)}&l=english&cc=US`);
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

    // 2. Fetch schema
    const schemaUrl = proxy(`https://api.steampowered.com/ISteamUserStats/GetSchemaForGame/v2/?key=${apiKey}&appid=${appid}`);
    console.log('Fetching Steam schema:', schemaUrl);
    const schemaRes = await fetch(schemaUrl);
    
    if (!schemaRes.ok) {
        throw new Error(`Schema fetch failed: ${schemaRes.status} ${schemaRes.statusText}`);
    }
    
    const schemaData = await schemaRes.json();
    console.log('Steam schema data:', schemaData);

    if (!schemaData.game || !schemaData.game.availableGameStats || !schemaData.game.availableGameStats.achievements) {
      console.warn('No achievements in schema for:', appid);
      return [];
    }

    const achievements = schemaData.game.availableGameStats.achievements;
    console.log('Achievements count:', achievements.length);

    // 3. Fetch global percentages
    let percentages: any[] = [];
    try {
      const pctUrl = proxy(`https://api.steampowered.com/ISteamUserStats/GetGlobalAchievementPercentagesForApp/v2/?gameid=${appid}`);
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
