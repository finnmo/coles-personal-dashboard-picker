export type RateLimitResult = { allowed: true } | { allowed: false; retryAfterMs: number }

export interface RateLimiter {
  check(identifier: string): RateLimitResult
  flush(): void
}

export function createRateLimiter({
  windowMs,
  maxRequests,
}: {
  windowMs: number
  maxRequests: number
}): RateLimiter {
  const store = new Map<string, number[]>()

  return {
    check(identifier: string): RateLimitResult {
      const now = Date.now()
      const windowStart = now - windowMs
      const timestamps = (store.get(identifier) ?? []).filter((t) => t > windowStart)

      if (timestamps.length >= maxRequests) {
        const oldest = timestamps[0]
        const retryAfterMs = oldest + windowMs - now
        store.set(identifier, timestamps)
        return { allowed: false, retryAfterMs: Math.max(retryAfterMs, 0) }
      }

      timestamps.push(now)
      store.set(identifier, timestamps)
      return { allowed: true }
    },

    flush() {
      store.clear()
    },
  }
}
