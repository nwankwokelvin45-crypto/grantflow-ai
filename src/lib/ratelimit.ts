// Simple in-memory rate limiter (replace with @upstash/ratelimit in production)
const store = new Map<string, { count: number; reset: number }>();

export function rateLimit(key: string, limit: number, windowMs: number): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || entry.reset < now) {
    store.set(key, { count: 1, reset: now + windowMs });
    return { allowed: true, remaining: limit - 1 };
  }

  if (entry.count >= limit) {
    return { allowed: false, remaining: 0 };
  }

  entry.count++;
  return { allowed: true, remaining: limit - entry.count };
}

// Presets
export const authLimiter = (ip: string) => rateLimit(`auth:${ip}`, 10, 15 * 60 * 1000);   // 10 per 15 min
export const aiLimiter = (userId: string) => rateLimit(`ai:${userId}`, 20, 60 * 1000);     // 20 per minute
export const apiLimiter = (ip: string) => rateLimit(`api:${ip}`, 100, 60 * 1000);          // 100 per minute
