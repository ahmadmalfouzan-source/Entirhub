import { supabase } from '@/lib/supabase';
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

export const getSteamPrice = async (appId: number, region: string): Promise<SteamPriceData | null | 'free'> => {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey) return null;

  try {
    const url = `${supabaseUrl}/functions/v1/steam-proxy?type=price&appid=${appId}&cc=${region}`;
    console.log('[SteamPrice Debug] Requesting Edge Function:', url);
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${supabaseKey}`,
        'apikey': supabaseKey,
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[SteamPrice Debug] Edge Function error:', errorText);
      return null;
    }

    const data = await response.json();
    const appData = data[appId.toString()];
    
    if (!appData?.success) return null;
    if (appData.data.is_free) return 'free';
    
    return appData.data.price_overview || null;
  } catch (err) {
    console.error('[SteamPrice Debug] Fetch failed:', err);
    return null;
  }
};

export interface SteamLowRecord {
  amount: number;
  currency: string;
  formatted: string;
}

export const getSteamHistoricalLow = async (appid: number): Promise<SteamLowRecord | null> => {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey) return null;

  try {
    const authHeaders = {
      'Authorization': `Bearer ${supabaseKey}`,
      'apikey': supabaseKey
    };

    // 1. Get ITAD ID from Steam AppID via Edge Function
    const lookupUrl = `${supabaseUrl}/functions/v1/steam-proxy?type=itad_lookup&appid=${appid}`;
    const lookupRes = await fetch(lookupUrl, { headers: authHeaders });
    if (!lookupRes.ok) return null;
    const lookupData = await lookupRes.json();
    if (!lookupData?.found || !lookupData?.game?.id) return null;

    const gameId = lookupData.game.id;

    // 2. Get Historical Low via Edge Function
    const lowUrl = `${supabaseUrl}/functions/v1/steam-proxy?type=itad_low&gameid=${gameId}`;
    const lowRes = await fetch(lowUrl, { headers: authHeaders });
    if (!lowRes.ok) return null;
    const lowData = await lowRes.json();
    
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
