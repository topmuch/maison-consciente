/* ═══════════════════════════════════════════════════════
   RECIPE CACHE — Redis adapter (optional)
   
   Only loaded when process.env.REDIS_URL is set.
   Requires ioredis (already in project dependencies).
   ═══════════════════════════════════════════════════════ */

import Redis from 'ioredis';
import type { RecipeCacheAdapter } from './recipe-cache';

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

export function createRedisAdapter(redisUrl: string): RecipeCacheAdapter {
  const redis = new Redis(redisUrl, {
    maxRetriesPerRequest: 3,
    retryStrategy(times) {
      const delay = Math.min(times * 200, 2000);
      return delay;
    },
    lazyConnect: true,
  });

  // Graceful error handling
  redis.on('error', (err) => {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[RecipeCache-Redis] Error:', err.message);
    }
  });

  const PREFIX = 'recipe:';

  return {
    async get<T>(key: string): Promise<T | null> {
      try {
        const raw = await redis.get(`${PREFIX}${key}`);
        if (!raw) return null;
        const entry = JSON.parse(raw) as CacheEntry<T>;
        if (Date.now() > entry.expiresAt) {
          await redis.del(`${PREFIX}${key}`);
          return null;
        }
        return entry.data;
      } catch {
        return null;
      }
    },

    async set<T>(key: string, data: T, ttlMs: number): Promise<void> {
      try {
        const entry: CacheEntry<T> = {
          data,
          expiresAt: Date.now() + ttlMs,
        };
        // Set Redis TTL with 10% buffer
        await redis.set(
          `${PREFIX}${key}`,
          JSON.stringify(entry),
          'EX',
          Math.ceil(ttlMs / 1000) + 60
        );
      } catch {
        // silent
      }
    },

    async delete(key: string): Promise<void> {
      try {
        await redis.del(`${PREFIX}${key}`);
      } catch {
        // silent
      }
    },

    async clear(): Promise<void> {
      try {
        // Use SCAN for safety in production
        let cursor = '0';
        do {
          const [nextCursor, keys] = await redis.scan(
            Number(cursor),
            'MATCH',
            `${PREFIX}*`,
            'COUNT',
            100
          );
          cursor = nextCursor;
          if (keys.length > 0) {
            await redis.del(...keys);
          }
        } while (cursor !== '0');
      } catch {
        // silent
      }
    },

    async has(key: string): Promise<boolean> {
      try {
        const exists = await redis.exists(`${PREFIX}${key}`);
        return exists === 1;
      } catch {
        return false;
      }
    },
  };
}
