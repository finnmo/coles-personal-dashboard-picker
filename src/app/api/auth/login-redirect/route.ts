import { NextResponse } from 'next/server'
import { verifyPassword, createSessionToken } from '@/lib/auth'
import { createRateLimiter } from '@/lib/rate-limiter'

const loginLimiter = createRateLimiter({ windowMs: 15 * 60 * 1000, maxRequests: 10 })

function getIp(request: Request): string {
  return request.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? 'unknown'
}

/**
 * Build an absolute URL using the Host request header so that redirects
 * work correctly when the app is running inside Docker. Inside Docker,
 * request.url contains the server's bind address (0.0.0.0) rather than
 * the address the client actually used, so we must use the Host header.
 */
function clientUrl(request: Request, path: string): string {
  const host = request.headers.get('x-forwarded-host') ?? request.headers.get('host')
  const proto = request.headers.get('x-forwarded-proto') ?? 'http'
  return host ? `${proto}://${host}${path}` : new URL(path, request.url).toString()
}

function loginUrl(request: Request, error: string): string {
  return clientUrl(request, `/login?error=${encodeURIComponent(error)}`)
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
    return NextResponse.redirect(loginUrl(request, 'too_many_attempts'), { status: 303 })
  }

  let password: string | null = null
  try {
    const form = await request.formData()
    password = form.get('password') as string | null
  } catch {
    return NextResponse.redirect(loginUrl(request, 'invalid_request'), { status: 303 })
  }

  if (!password) {
    return NextResponse.redirect(loginUrl(request, 'invalid'), { status: 303 })
  }

  const hash = process.env.APP_PASSWORD_HASH
  if (!hash) {
    return NextResponse.redirect(loginUrl(request, 'server'), { status: 303 })
  }

  const valid = await verifyPassword(password, hash)
  if (!valid) {
    return NextResponse.redirect(loginUrl(request, 'invalid'), { status: 303 })
  }

  const token = await createSessionToken()
  const expiryHours = parseInt(process.env.SESSION_EXPIRY_HOURS ?? '24', 10)
  const secureCookie = process.env.SECURE_COOKIES === 'true'

  // 303 See Other — browser follows with a GET, cookie is set on this navigation
  // response and stored in the persistent cookie jar.
  const response = NextResponse.redirect(clientUrl(request, '/dashboard'), { status: 303 })
  response.cookies.set('session', token, {
    httpOnly: true,
    secure: secureCookie,
    sameSite: 'lax',
    maxAge: expiryHours * 60 * 60,
    path: '/',
  })
  return response
}
