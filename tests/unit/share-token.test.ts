// @vitest-environment node
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { createShareToken, verifyShareToken } from '@/lib/share-token'

beforeEach(() => {
  process.env.SHARE_SECRET = 'test-share-secret-that-is-at-least-32-chars!!'
})

afterEach(() => {
  vi.useRealTimers()
  delete process.env.SHARE_SECRET
})

describe('createShareToken / verifyShareToken', () => {
  it('valid token verifies successfully', async () => {
    const token = await createShareToken()
    expect(await verifyShareToken(token)).toBe(true)
  })

  it('expired token returns false', async () => {
    vi.useFakeTimers()
    const token = await createShareToken()
    // Advance 25 hours
    vi.advanceTimersByTime(25 * 60 * 60 * 1000)
    expect(await verifyShareToken(token)).toBe(false)
  })

  it('garbage string returns false', async () => {
    expect(await verifyShareToken('not-a-valid-token')).toBe(false)
  })
})
