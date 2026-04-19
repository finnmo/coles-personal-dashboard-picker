// @vitest-environment node
import { describe, it, expect, beforeAll } from 'vitest'
import { hashPassword } from '@/lib/auth'

// We test the route handler functions directly, bypassing the HTTP layer.
// This avoids needing a running Next.js server while still exercising real logic.
import { POST as loginHandler } from '@/app/api/auth/login/route'
import { POST as logoutHandler } from '@/app/api/auth/logout/route'

async function makeLoginRequest(password: string) {
  const request = new Request('http://localhost/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password }),
  })
  return loginHandler(request)
}

beforeAll(async () => {
  process.env.SESSION_SECRET = 'integration-test-secret-that-is-32-chars-long'
  process.env.SESSION_EXPIRY_HOURS = '1'
  process.env.APP_PASSWORD_HASH = await hashPassword('correct-password')
})

describe('POST /api/auth/login', () => {
  it('returns 200 and sets session cookie for correct password', async () => {
    const res = await makeLoginRequest('correct-password')
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.ok).toBe(true)
    const setCookie = res.headers.get('set-cookie')
    expect(setCookie).toMatch(/session=/)
    expect(setCookie).toMatch(/HttpOnly/i)
  })

  it('returns 401 for wrong password', async () => {
    const res = await makeLoginRequest('wrong-password')
    expect(res.status).toBe(401)
    const body = await res.json()
    expect(body.error).toBe('Invalid password')
  })

  it('returns 400 for missing password field', async () => {
    const request = new Request('http://localhost/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    })
    const res = await loginHandler(request)
    expect(res.status).toBe(400)
  })

  it('returns 400 for malformed JSON body', async () => {
    const request = new Request('http://localhost/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 'not-json',
    })
    const res = await loginHandler(request)
    expect(res.status).toBe(400)
  })
})

describe('POST /api/auth/logout', () => {
  it('returns 200 and clears session cookie', async () => {
    const res = await logoutHandler()
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.ok).toBe(true)
    // Cookie should be cleared (max-age=0 or expires in past)
    const setCookie = res.headers.get('set-cookie')
    // Next.js cookie.delete() sets Max-Age=0
    expect(setCookie).toMatch(/session=;|Max-Age=0/i)
  })
})
