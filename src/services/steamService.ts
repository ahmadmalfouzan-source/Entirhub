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
    const searchRes = await fetch(searchUrl, { headers: authHeaders }).catch(() => null);
    
    if (!searchRes || !searchRes.ok) return null;
    
    const searchData = await searchRes.json();
    if (!searchData?.items || searchData.items.length === 0) return null;

    return searchData.items[0].id;
  } catch (err) {
    return null;
  }
};

export interface SteamPriceData {
  currency: string;
  initial: number;
  final: number;
  discount_percent: number;
  initial_formatted: string;
  final_formatted: string;
}

export const getSteamPrice = async (appid: number, cc: string): Promise<SteamPriceData | null | 'free'> => {
  try {
    const url = `https://store.steampowered.com/api/appdetails?appids=${appid}&cc=${cc}&filters=price_overview`;
    const proxyUrl = `/api/steam?url=${encodeURIComponent(url)}`;
    const res = await fetch(proxyUrl);
    if (!res.ok) return null;
    
    const data = await res.json();
    const appData = data[appid.toString()];
    
    if (!appData?.success) return null;
    if (appData.data.is_free) return 'free';
    
    return appData.data.price_overview || null;
  } catch (err) {
    console.error(`[Steam] Price fetch failed for ${cc}:`, err);
    return null;
  }
};

export interface SteamLowRecord {
  amount: number;
  currency: string;
  formatted: string;
}

export const getSteamHistoricalLow = async (appid: number): Promise<SteamLowRecord | null> => {
  const itadKey = import.meta.env.VITE_ITAD_API_KEY;
  if (!itadKey || itadKey === 'MY_ITAD_API_KEY' || !itadKey.trim()) return null;

  try {
    // 1. Get ITAD ID from Steam AppID
    const lookupUrl = `https://api.isthereanydeal.com/games/lookup/v1?key=${itadKey}&appid=${appid}`;
    const lookupProxy = `/api/steam?url=${encodeURIComponent(lookupUrl)}`;
    const lookupRes = await fetch(lookupProxy);
    if (!lookupRes.ok) return null;
    const lookupData = await lookupRes.json();
    if (!lookupData?.found || !lookupData?.game?.id) return null;

    const gameId = lookupData.game.id;

    // 2. Get Historical Low
    const lowUrl = `https://api.isthereanydeal.com/games/storelow/v2?key=${itadKey}&id=${gameId}&shops=61`; // 61 is usually Steam
    const lowProxy = `/api/steam?url=${encodeURIComponent(lowUrl)}`;
    const lowRes = await fetch(lowProxy);
    if (!lowRes.ok) return null;
    const lowData = await lowRes.json();
    
    // ITAD v2 returns an object keyed by ITAD game IDs
    const gameLowData = lowData[gameId];
    if (!gameLowData || !Array.isArray(gameLowData)) return null;

    const steamLow = gameLowData.find((s: any) => s.shop.id === 61 || s.shop.name?.toLowerCase().includes('steam'));
    if (!steamLow?.price) return null;

    return {
      amount: steamLow.price.amount,
      currency: steamLow.price.currency,
      formatted: `${steamLow.price.amount} ${steamLow.price.currency}`
    };
  } catch (err) {
    console.error('[Steam] Historical low fetch failed:', err);
    return null;
  }
};

export const createPriceAlert = async (params: {
  userId: string;
  gameName: string;
  steamAppId: number;
  targetPrice: number;
  currentPrice: number;
}) => {
  const { error } = await supabase
    .from('price_alerts')
    .insert([{
      user_id: params.userId,
      game_name: params.gameName,
      steam_appid: params.steamAppId,
      target_price: params.targetPrice,
      current_price: params.currentPrice,
      is_triggered: false
    }]);

  if (error) throw error;
  return true;
};

export const getPriceAlert = async (userId: string, steamAppId: number) => {
  const { data, error } = await supabase
    .from('price_alerts')
    .select('*')
    .eq('user_id', userId)
    .eq('steam_appid', steamAppId)
    .single();
    
  if (error && error.code !== 'PGRST116') throw error;
  return data;
};

export const deletePriceAlert = async (alertId: string) => {
  const { error } = await supabase
    .from('price_alerts')
    .delete()
    .eq('id', alertId);
    
  if (error) throw error;
  return true;
};

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
    const appid = await getSteamAppId(gameName);
    if (!appid) return [];

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
