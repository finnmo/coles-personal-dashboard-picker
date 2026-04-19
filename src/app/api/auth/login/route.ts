import { NextResponse } from 'next/server'
import { verifyPassword, createSessionToken } from '@/lib/auth'
import type { LoginRequest } from '@/types/api'

export async function POST(request: Request) {
  let body: LoginRequest
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { password } = body
  if (!password || typeof password !== 'string') {
    return NextResponse.json({ error: 'Password is required' }, { status: 400 })
  }

  const hash = process.env.APP_PASSWORD_HASH
  if (!hash) {
    return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 })
  }

  const valid = await verifyPassword(password, hash)
  if (!valid) {
    return NextResponse.json({ error: 'Invalid password' }, { status: 401 })
  }

  const token = await createSessionToken()
  const expiryHours = parseInt(process.env.SESSION_EXPIRY_HOURS ?? '24', 10)

  const response = NextResponse.json({ ok: true })
  response.cookies.set('session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: expiryHours * 60 * 60,
    path: '/',
  })
  return response
}
