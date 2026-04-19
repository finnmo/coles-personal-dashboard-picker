// @vitest-environment node
import { describe, it, expect, beforeEach } from 'vitest'
import { hashPassword, verifyPassword, createSessionToken, verifySessionToken } from '@/lib/auth'

beforeEach(() => {
  process.env.SESSION_SECRET = 'test-secret-that-is-at-least-32-characters-long'
  process.env.SESSION_EXPIRY_HOURS = '1'
})

describe('hashPassword', () => {
  it('returns a bcrypt hash string', async () => {
    const hash = await hashPassword('mysecret')
    expect(hash).toMatch(/^\$2[ab]\$10\$/)
  })

  it('produces different hashes for the same password (salted)', async () => {
    const hash1 = await hashPassword('mysecret')
    const hash2 = await hashPassword('mysecret')
    expect(hash1).not.toBe(hash2)
  })
})

describe('verifyPassword', () => {
  it('returns true for correct password', async () => {
    const hash = await hashPassword('correct')
    expect(await verifyPassword('correct', hash)).toBe(true)
  })

  it('returns false for wrong password', async () => {
    const hash = await hashPassword('correct')
    expect(await verifyPassword('wrong', hash)).toBe(false)
  })

  it('returns false for empty password against valid hash', async () => {
    const hash = await hashPassword('correct')
    expect(await verifyPassword('', hash)).toBe(false)
  })
})

describe('createSessionToken', () => {
  it('returns a JWT string with three dot-separated segments', async () => {
    const token = await createSessionToken()
    expect(token.split('.')).toHaveLength(3)
  })

  it('starts with the base64url-encoded HS256 header', async () => {
    const token = await createSessionToken()
    expect(token).toMatch(/^eyJ/)
  })
})

describe('verifySessionToken', () => {
  it('returns true for a freshly created token', async () => {
    const token = await createSessionToken()
    expect(await verifySessionToken(token)).toBe(true)
  })

  it('returns false for a garbage string', async () => {
    expect(await verifySessionToken('not.a.token')).toBe(false)
  })

  it('returns false for a token signed with a different secret', async () => {
    const token = await createSessionToken()
    process.env.SESSION_SECRET = 'completely-different-secret-that-is-32-chars'
    expect(await verifySessionToken(token)).toBe(false)
  })

  it('returns false for an expired token', async () => {
    // Set a -1h expiry to force immediate expiry
    process.env.SESSION_EXPIRY_HOURS = '-1'
    const token = await createSessionToken()
    expect(await verifySessionToken(token)).toBe(false)
  })
})
