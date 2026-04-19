import { supabase } from '../lib/supabase';

const memoryCache = new Map<string, { data: any; expires: number }>();

export function getMemoryCache(key: string) {
  const item = memoryCache.get(key);
  if (!item) return null;
  if (Date.now() > item.expires) {
    memoryCache.delete(key);
    return null;
  }
  return item.data;
}

export function setMemoryCache(key: string, data: any, minutes = 5) {
  memoryCache.set(key, {
    data,
    expires: Date.now() + minutes * 60 * 1000,
  });
}

export async function getCache(key: string) {
  const { data, error } = await supabase
    .from('content_cache')
    .select('data, expires_at')
    .eq('cache_key', key)
    .single();
  
  if (error || !data) return null;
  if (data.expires_at && new Date(data.expires_at) < new Date()) {
    // Optionally clean up expired cache
    return null;
  }
  return data.data;
}

export async function setCache(key: string, data: any, expiresInHours = 24) {
  const expires_at = new Date();
  if (expiresInHours === 0) {
    // Set to 50 years in the future for "no expiry"
    expires_at.setFullYear(expires_at.getFullYear() + 50);
  } else {
    expires_at.setHours(expires_at.getHours() + expiresInHours);
  }
  
  try {
    await supabase.from('content_cache').upsert({
      cache_key: key,
      data,
      expires_at: expires_at.toISOString(),
    });
  } catch (err) {
    console.warn('Cache write failed:', err);
  }
}

// Get cache even if expired (fallback for errors)
export async function getCacheIgnoreExpiry(key: string) {
  const { data } = await supabase
    .from('content_cache')
    .select('data')
    .eq('cache_key', key)
    .single();
  return data?.data || null;
}

// Stale-While-Revalidate pattern
export async function getCacheOrFetch<T>(
  key: string,
  fetchFn: () => Promise<T>,
  options: {
    expiresInHours?: number;
    staleWhileRevalidate?: boolean;
    fallbackOnError?: boolean;
  } = {}
): Promise<T> {
  const { expiresInHours = 24, staleWhileRevalidate = true, fallbackOnError = true } = options;
  try {
    // Check memory cache first (fastest)
    const memory = getMemoryCache(key);
    if (memory) return memory as T;

    // Then check Supabase cache
    const cached = await getCache(key);
    if (cached) {
      setMemoryCache(key, cached, 5); // store in memory for 5 mins
      if (staleWhileRevalidate) {
        fetchFn().then(fresh => setCache(key, fresh, expiresInHours)).catch(() => {});
      }
      return cached as T;
    }
    const fresh = await fetchFn();
    await setCache(key, fresh, expiresInHours);
    setMemoryCache(key, fresh, 5);
    return fresh;
  } catch (error) {
    if (fallbackOnError) {
      const stale = await getCacheIgnoreExpiry(key);
      if (stale) return stale as T;
    }
    throw error;
  }
}

// Batch get multiple cache keys at once
export async function getBatchCache(keys: string[]) {
  const { data } = await supabase
    .from('content_cache')
    .select('cache_key, data, expires_at')
    .in('cache_key', keys);
  return data || [];
}

// Invalidate cache by pattern
export async function invalidateCache(keyPattern: string) {
  await supabase
    .from('content_cache')
    .delete()
    .like('cache_key', `%${keyPattern}%`);
}
