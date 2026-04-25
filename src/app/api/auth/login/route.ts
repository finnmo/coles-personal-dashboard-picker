import { verifyPassword, createSessionToken } from '@/lib/auth'
import { apiError, apiOk } from '@/lib/api-response'
import { createRateLimiter } from '@/lib/rate-limiter'
import type { LoginRequest } from '@/types/api'

const loginLimiter = createRateLimiter({ windowMs: 15 * 60 * 1000, maxRequests: 10 })

function getIp(request: Request): string {
  return request.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? 'unknown'
}

export async function POST(request: Request) {
  const ip = getIp(request)
  const limit = loginLimiter.check(ip)
  if (!limit.allowed) {
    const retryAfterSec = Math.ceil(limit.retryAfterMs / 1000)
    const res = apiError('Too many login attempts', 'RATE_LIMITED', 429)
    res.headers.set('Retry-After', String(retryAfterSec))
    return res
  }

  let body: LoginRequest
  try {
    body = await request.json()
  } catch {
    return apiError('Invalid request body', 'VALIDATION_ERROR', 400)
  }

  const { password } = body
  if (!password || typeof password !== 'string') {
    return apiError('Password is required', 'VALIDATION_ERROR', 400)
  }

  const hash = process.env.APP_PASSWORD_HASH
  if (!hash) {
    return apiError('Server misconfigured', 'SERVER_ERROR', 500)
  }

  const valid = await verifyPassword(password, hash)
  if (!valid) {
    return apiError('Invalid password', 'UNAUTHORISED', 401)
  }

  const token = await createSessionToken()
  const expiryHours = parseInt(process.env.SESSION_EXPIRY_HOURS ?? '24', 10)

  const response = apiOk({ ok: true })
  // Default to false — this app runs over plain HTTP on a LAN.
  // Set SECURE_COOKIES=true only if you've terminated HTTPS upstream.
  const secureCookie = process.env.SECURE_COOKIES === 'true'
  response.cookies.set('session', token, {
    httpOnly: true,
    secure: secureCookie,
    sameSite: 'lax',
    maxAge: expiryHours * 60 * 60,
    path: '/',
  })
  return response
}
