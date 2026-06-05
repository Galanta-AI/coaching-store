/**
 * In-memory IP-based rate limiter.
 *
 * IMPORTANT — honest framing: this is BEST-EFFORT. On any serverless platform
 * (including Firebase App Hosting) each function instance has its own Map; the
 * limit resets on cold start and isn't shared across concurrently-scaled
 * instances.
 *
 * Use this to reduce noise from misbehaving clients (lazy scrapers, runaway
 * test scripts). DO NOT rely on it as a security control against a
 * coordinated attacker — they can route around it with concurrency.
 *
 * Upgrade path: swap the Map for Upstash Redis or Firestore via
 * `@upstash/ratelimit`. The call site (`hit(key)`) stays the same.
 */

interface Bucket {
  count: number;
  resetAt: number;
}

interface Limiter {
  hit(key: string): { allowed: boolean; remaining: number };
}

const cleanupInterval = 10 * 60 * 1000;

export function createLimiter(opts: { limit: number; windowMs: number }): Limiter {
  const buckets = new Map<string, Bucket>();

  setInterval(() => {
    const now = Date.now();
    for (const [key, bucket] of buckets) {
      if (bucket.resetAt <= now) buckets.delete(key);
    }
  }, cleanupInterval).unref?.();

  return {
    hit(key: string) {
      const now = Date.now();
      const bucket = buckets.get(key);
      if (!bucket || bucket.resetAt <= now) {
        buckets.set(key, { count: 1, resetAt: now + opts.windowMs });
        return { allowed: true, remaining: opts.limit - 1 };
      }
      if (bucket.count >= opts.limit) {
        return { allowed: false, remaining: 0 };
      }
      bucket.count++;
      return { allowed: true, remaining: opts.limit - bucket.count };
    },
  };
}

export function clientIp(headers: Headers): string {
  return headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
}
