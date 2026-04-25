import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { makeSearchCache } from '@/lib/make-search-cache'

describe('makeSearchCache', () => {
  let cache: ReturnType<typeof makeSearchCache<{ id: string }>>

  beforeEach(() => {
    vi.useFakeTimers()
    cache = makeSearchCache<{ id: string }>()
  })

  afterEach(() => {
    cache.flush()
    vi.useRealTimers()
  })

  it('returns null for unknown query', () => {
    expect(cache.getCached('milk')).toBeNull()
  })

  it('returns cached results', () => {
    const results = [{ id: '1' }, { id: '2' }]
    cache.setCached('milk', results)
    expect(cache.getCached('milk')).toEqual(results)
  })

  it('is case-insensitive', () => {
    cache.setCached('Milk', [{ id: '1' }])
    expect(cache.getCached('milk')).toEqual([{ id: '1' }])
    expect(cache.getCached('MILK')).toEqual([{ id: '1' }])
  })

  it('returns null after TTL expires', () => {
    cache.setCached('milk', [{ id: '1' }])
    vi.advanceTimersByTime(10 * 60 * 1000 + 1)
    expect(cache.getCached('milk')).toBeNull()
  })

  it('flush clears all entries', () => {
    cache.setCached('milk', [{ id: '1' }])
    cache.flush()
    expect(cache.getCached('milk')).toBeNull()
  })
})
