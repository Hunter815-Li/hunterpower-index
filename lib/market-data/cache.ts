interface CacheEntry<T> {
  value?: T;
  expiresAt: number;
  pending?: Promise<T>;
}

type MarketCache = Map<string, CacheEntry<unknown>>;

const globalCache = globalThis as typeof globalThis & { __hunterMarketCache?: MarketCache };
const cache: MarketCache = globalCache.__hunterMarketCache ?? new Map();
globalCache.__hunterMarketCache = cache;

/**
 * Instance-local cache used by API routes and the real-time gateway. Vercel and
 * other serverless platforms may keep more than one instance, so callers must
 * still treat the upstream provider as authoritative.
 */
export async function withMemoryCache<T>(key: string, ttlMs: number, loader: () => Promise<T>): Promise<T> {
  const now = Date.now();
  const current = cache.get(key) as CacheEntry<T> | undefined;
  if (current?.value !== undefined && current.expiresAt > now) return current.value;
  if (current?.pending) return current.pending;

  const pending = loader()
    .then((value) => {
      cache.set(key, { value, expiresAt: Date.now() + ttlMs });
      return value;
    })
    .catch((error) => {
      cache.delete(key);
      throw error;
    });

  cache.set(key, { expiresAt: now + ttlMs, pending });
  return pending;
}

export function clearMemoryCache(prefix?: string) {
  if (!prefix) return cache.clear();
  for (const key of cache.keys()) if (key.startsWith(prefix)) cache.delete(key);
}
