import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { createRateLimiter } from '@/lib/rate-limiter'

describe('createRateLimiter', () => {
  let limiter: ReturnType<typeof createRateLimiter>

  beforeEach(() => {
    vi.useFakeTimers()
    limiter = createRateLimiter({ windowMs: 1000, maxRequests: 3 })
  })

  afterEach(() => {
    limiter.flush()
    vi.useRealTimers()
  })

  it('allows requests under the limit', () => {
    expect(limiter.check('ip1')).toEqual({ allowed: true })
    expect(limiter.check('ip1')).toEqual({ allowed: true })
    expect(limiter.check('ip1')).toEqual({ allowed: true })
  })

  it('blocks at the limit', () => {
    limiter.check('ip1')
    limiter.check('ip1')
    limiter.check('ip1')
    const result = limiter.check('ip1')
    expect(result.allowed).toBe(false)
    if (!result.allowed) {
      expect(result.retryAfterMs).toBeGreaterThan(0)
    }
  })

  it('allows again after window expires', () => {
    limiter.check('ip1')
    limiter.check('ip1')
    limiter.check('ip1')
    expect(limiter.check('ip1').allowed).toBe(false)

    vi.advanceTimersByTime(1001)
    expect(limiter.check('ip1')).toEqual({ allowed: true })
  })

  it('tracks different IPs independently', () => {
    limiter.check('ip1')
    limiter.check('ip1')
    limiter.check('ip1')
    expect(limiter.check('ip1').allowed).toBe(false)
    expect(limiter.check('ip2')).toEqual({ allowed: true })
  })

  it('flush resets all state', () => {
    limiter.check('ip1')
    limiter.check('ip1')
    limiter.check('ip1')
    limiter.flush()
    expect(limiter.check('ip1')).toEqual({ allowed: true })
  })

  it('retryAfterMs is positive when blocked', () => {
    limiter.check('ip1')
    limiter.check('ip1')
    limiter.check('ip1')
    const result = limiter.check('ip1')
    if (!result.allowed) {
      expect(result.retryAfterMs).toBeGreaterThan(0)
      expect(result.retryAfterMs).toBeLessThanOrEqual(1000)
    }
  })
})
