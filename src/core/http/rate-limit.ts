/**
 * Simple in-memory rate limiter for API routes.
 *
 * Suitable for a single-process desktop app — no external dependencies.
 * Expired entries are cleaned up every 60 seconds automatically.
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

interface RateLimitResult {
  success: boolean;
  remaining: number;
  reset: number;
}

interface RateLimitOptions {
  /** Time window in milliseconds */
  interval: number;
  /** Maximum requests allowed per window */
  limit: number;
}

export function rateLimit(options: RateLimitOptions): (key: string) => RateLimitResult {
  const { interval, limit } = options;
  const store = new Map<string, RateLimitEntry>();

  // Periodically purge expired entries to prevent memory leaks.
  const cleanup = setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store) {
      if (now > entry.resetTime) {
        store.delete(key);
      }
    }
  }, 60_000);

  // Allow the timer to not keep the process alive.
  if (cleanup && typeof cleanup === "object" && "unref" in cleanup) {
    cleanup.unref();
  }

  return (key: string): RateLimitResult => {
    const now = Date.now();
    const entry = store.get(key);

    // First request or window expired — start a fresh window.
    if (!entry || now > entry.resetTime) {
      store.set(key, { count: 1, resetTime: now + interval });
      return { success: true, remaining: limit - 1, reset: now + interval };
    }

    // Within the current window — check limit.
    if (entry.count >= limit) {
      return { success: false, remaining: 0, reset: entry.resetTime };
    }

    entry.count += 1;
    return {
      success: true,
      remaining: limit - entry.count,
      reset: entry.resetTime,
    };
  };
}
