// @vitest-environment node
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { createShareToken, verifyShareToken } from '@/lib/share-token'

beforeEach(() => {
  process.env.SESSION_SECRET = 'test-secret-that-is-at-least-32-chars-long!!'
})

afterEach(() => {
  vi.useRealTimers()
  delete process.env.SESSION_SECRET
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

  it('session token with wrong type returns false', async () => {
    const { SignJWT } = await import('jose')
    const secret = new TextEncoder().encode(process.env.SESSION_SECRET)
    const sessionToken = await new SignJWT({ authenticated: true })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('24h')
      .sign(secret)
    expect(await verifyShareToken(sessionToken)).toBe(false)
  })

  it('garbage string returns false', async () => {
    expect(await verifyShareToken('not-a-valid-token')).toBe(false)
  })
})
