import { Redis } from "ioredis";

let redis: Redis | null = null;
let redisConnected = false;

function getRedis(): Redis | null {
  if (!process.env.REDIS_URL) return null;
  if (redis) return redis;

  try {
    redis = new Redis(process.env.REDIS_URL, {
      maxRetriesPerRequest: 3,
      retryStrategy: (times) => Math.min(times * 200, 2000),
      lazyConnect: true,
    });

    redis.on("connect", () => {
      redisConnected = true;
    });

    redis.on("error", (err) => {
      console.warn("[Redis] Connection error:", err.message);
      redisConnected = false;
    });

    redis.connect().catch(() => {
      // Connection failed, will fallback to direct execution
    });
  } catch (err) {
    console.warn("[Redis] Failed to create client:", err);
    redis = null;
  }

  return redis;
}

export async function cacheGet<T>(key: string): Promise<T | null> {
  const client = getRedis();
  if (!client || !redisConnected) return null;

  try {
    const data = await client.get(key);
    if (data) return JSON.parse(data) as T;
  } catch {
    // Cache miss or error — proceed without cache
  }

  return null;
}

export async function cacheSet<T>(key: string, data: T, ttlSeconds: number = 900): Promise<void> {
  const client = getRedis();
  if (!client || !redisConnected) return;

  try {
    await client.set(key, JSON.stringify(data), "EX", ttlSeconds);
  } catch {
    // Silently fail — cache is optional
  }
}

export async function cacheDel(key: string): Promise<void> {
  const client = getRedis();
  if (!client || !redisConnected) return;

  try {
    await client.del(key);
  } catch {
    // silent
  }
}

/**
 * Cache-aside pattern: tries cache first, falls back to fn(), caches result
 */
export async function cache<T>(
  key: string,
  ttlSec: number,
  fn: () => Promise<T>,
): Promise<T> {
  // Try cache first
  const cached = await cacheGet<T>(key);
  if (cached !== null) return cached;

  // Execute function
  const result = await fn();

  // Cache result (fire and forget)
  cacheSet(key, result, ttlSec).catch(() => {});

  return result;
}

export function getRedisStatus(): { available: boolean; connected: boolean } {
  return {
    available: !!process.env.REDIS_URL,
    connected: redisConnected,
  };
}
