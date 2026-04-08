const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

// Cleanup old entries every 10 minutes
if (typeof globalThis !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of rateLimitMap) {
      if (now > entry.resetAt) rateLimitMap.delete(key);
    }
  }, 600_000);
}

export function rateLimit(ip: string, maxRequests = 10, windowMs = 60000): { limited: boolean; retryAfter: number } {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + windowMs });
    return { limited: false, retryAfter: 0 };
  }
  entry.count++;
  return {
    limited: entry.count > maxRequests,
    retryAfter: Math.ceil((entry.resetAt - now) / 1000),
  };
}
