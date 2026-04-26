import { NextResponse } from 'next/server'
import { verifyPassword, createSessionToken } from '@/lib/auth'
import { createRateLimiter } from '@/lib/rate-limiter'

const loginLimiter = createRateLimiter({ windowMs: 15 * 60 * 1000, maxRequests: 10 })

function getIp(request: Request): string {
  return request.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? 'unknown'
}

function loginUrl(request: Request): URL {
  return new URL('/login', request.url)
}

/**
 * Accepts a native HTML form POST (application/x-www-form-urlencoded).
 * Sets the session cookie in the redirect response so that iOS Safari
 * stores it in the persistent cookie jar (cookies from fetch() responses
 * can be silently dropped on older Safari versions).
 */
export async function POST(request: Request) {
  const ip = getIp(request)
  const limit = loginLimiter.check(ip)
  if (!limit.allowed) {
    const url = loginUrl(request)
    url.searchParams.set('error', 'too_many_attempts')
    return NextResponse.redirect(url, { status: 303 })
  }

  let password: string | null = null
  try {
    const form = await request.formData()
    password = form.get('password') as string | null
  } catch {
    const url = loginUrl(request)
    url.searchParams.set('error', 'invalid_request')
    return NextResponse.redirect(url, { status: 303 })
  }

  if (!password) {
    const url = loginUrl(request)
    url.searchParams.set('error', 'invalid')
    return NextResponse.redirect(url, { status: 303 })
  }

  const hash = process.env.APP_PASSWORD_HASH
  if (!hash) {
    const url = loginUrl(request)
    url.searchParams.set('error', 'server')
    return NextResponse.redirect(url, { status: 303 })
  }

  const valid = await verifyPassword(password, hash)
  if (!valid) {
    const url = loginUrl(request)
    url.searchParams.set('error', 'invalid')
    return NextResponse.redirect(url, { status: 303 })
  }

  const token = await createSessionToken()
  const expiryHours = parseInt(process.env.SESSION_EXPIRY_HOURS ?? '24', 10)
  const secureCookie = process.env.SECURE_COOKIES === 'true'

  // 303 See Other — browser follows with a GET, cookie is set on this navigation
  // response and stored in the persistent cookie jar.
  const response = NextResponse.redirect(new URL('/dashboard', request.url), { status: 303 })
  response.cookies.set('session', token, {
    httpOnly: true,
    secure: secureCookie,
    sameSite: 'lax',
    maxAge: expiryHours * 60 * 60,
    path: '/',
  })
  return response
}
