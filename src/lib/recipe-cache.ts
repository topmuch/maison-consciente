/* ═══════════════════════════════════════════════════════
   RECIPE CACHE — Hybrid caching strategy
   
   - In-memory: Map with TTL + periodic cleanup (default)
   - Redis: optional if process.env.REDIS_URL is set
   
   Generic withCache<T>() utility for any async fetch.
   Zero external dependencies for in-memory mode.
   ═══════════════════════════════════════════════════════ */

/* ─── Cache entry ─── */

interface CacheEntry<T> {
  data: T;
  expiresAt: number; // epoch ms
}

/* ─── Adapter interface ─── */

export interface RecipeCacheAdapter {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, data: T, ttlMs: number): Promise<void>;
  delete(key: string): Promise<void>;
  clear(): Promise<void>;
  has(key: string): Promise<boolean>;
}

/* ─── In-memory implementation ─── */

class InMemoryCacheAdapter implements RecipeCacheAdapter {
  private store = new Map<string, CacheEntry<unknown>>();
  private cleanupTimer: ReturnType<typeof setInterval> | null = null;

  constructor(private cleanupIntervalMs = 60_000) {
    // Periodic cleanup of expired entries
    this.cleanupTimer = setInterval(() => this.cleanup(), this.cleanupIntervalMs);
    // Don't block process exit
    if (this.cleanupTimer.unref) {
      this.cleanupTimer.unref();
    }
  }

  async get<T>(key: string): Promise<T | null> {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return entry.data as T;
  }

  async set<T>(key: string, data: T, ttlMs: number): Promise<void> {
    this.store.set(key, {
      data,
      expiresAt: Date.now() + ttlMs,
    });
  }

  async delete(key: string): Promise<void> {
    this.store.delete(key);
  }

  async clear(): Promise<void> {
    this.store.clear();
  }

  async has(key: string): Promise<boolean> {
    const entry = this.store.get(key);
    if (!entry) return false;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return false;
    }
    return true;
  }

  /** Get cache size (useful for debugging) */
  size(): number {
    return this.store.size;
  }

  /** Force cleanup of all expired entries */
  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (now > entry.expiresAt) {
        this.store.delete(key);
      }
    }
  }

  /** Destroy timer (for testing / graceful shutdown) */
  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
  }
}

/* ─── Singleton cache instance ─── */

let _cache: RecipeCacheAdapter | null = null;

export async function getRecipeCache(): Promise<RecipeCacheAdapter> {
  if (!_cache) {
    const redisUrl = process.env.REDIS_URL;
    if (redisUrl) {
      // Lazy-load Redis adapter to avoid import errors when REDIS_URL is not set
      try {
        // Dynamic import to avoid bundling ioredis when not needed
        const mod = await import('./recipe-cache-redis');
        _cache = mod.createRedisAdapter(redisUrl);
        if (process.env.NODE_ENV === 'development') {
          console.log('[RecipeCache] Using Redis adapter');
        }
      } catch {
        if (process.env.NODE_ENV === 'development') {
          console.warn('[RecipeCache] REDIS_URL set but ioredis unavailable, falling back to in-memory');
        }
        _cache = new InMemoryCacheAdapter();
      }
    } else {
      _cache = new InMemoryCacheAdapter();
    }
  }
  return _cache;
}

/** Synchronous shortcut — returns the existing cache or creates in-memory */
export function getRecipeCacheSync(): RecipeCacheAdapter {
  if (!_cache) {
    _cache = new InMemoryCacheAdapter();
  }
  return _cache;
}

/* ─── withCache utility ─── */

/**
 * Wraps an async fetch function with caching.
 * If a cached result exists and hasn't expired, returns it immediately.
 * Otherwise, calls fetchFn, caches the result, and returns it.
 *
 * @param key  - Cache key (e.g. "themealdb:search:chicken")
 * @param ttlMs - Time-to-live in milliseconds (default: 1h)
 * @param fetchFn - Async function that fetches fresh data
 */
export async function withCache<T>(
  key: string,
  fetchFn: () => Promise<T>,
  ttlMs: number = Number(process.env.THEMEALDB_CACHE_TTL) || 3_600_000
): Promise<T> {
  const cache = await getRecipeCache();

  // Try cache first
  const cached = await cache.get<T>(key);
  if (cached !== null) {
    return cached;
  }

  // Fetch fresh data
  const fresh = await fetchFn();

  // Cache the result (even if it's an empty array, to avoid hammering API)
  await cache.set(key, fresh, ttlMs);

  return fresh;
}

/**
 * Clear cache entries matching a prefix.
 * Useful for invalidation (e.g. "themealdb:*").
 */
export async function clearCacheByPrefix(prefix: string): Promise<void> {
  // Note: In-memory adapter doesn't support prefix scanning efficiently.
  // For production with Redis, this would use KEYS or SCAN.
  // For now, just clear all — acceptable for dev/MVP.
  if (process.env.NODE_ENV === 'development') {
    console.log(`[RecipeCache] Clearing cache (prefix: "${prefix}" → full clear)`);
  }
  const cache = await getRecipeCache();
  await cache.clear();
}

/**
 * Get cache stats for debugging.
 */
export async function getCacheStats(): Promise<{ type: string; size: number }> {
  const cache = await getRecipeCache();
  const size = cache instanceof InMemoryCacheAdapter ? cache.size() : -1;
  return {
    type: process.env.REDIS_URL ? 'redis' : 'in-memory',
    size,
  };
}
