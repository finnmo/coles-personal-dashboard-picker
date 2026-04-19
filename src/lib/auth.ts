import bcrypt from 'bcryptjs'
import { SignJWT, jwtVerify } from 'jose'

const SESSION_COOKIE = 'session'
const ALGORITHM = 'HS256'

function getSecret(): Uint8Array {
  const secret = process.env.SESSION_SECRET
  if (!secret || secret.length < 32) {
    throw new Error('SESSION_SECRET must be set and at least 32 characters long')
  }
  return new TextEncoder().encode(secret)
}

function getExpiryHours(): number {
  return parseInt(process.env.SESSION_EXPIRY_HOURS ?? '24', 10)
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

export async function createSessionToken(): Promise<string> {
  const expiryHours = getExpiryHours()
  return new SignJWT({ authenticated: true })
    .setProtectedHeader({ alg: ALGORITHM })
    .setIssuedAt()
    .setExpirationTime(`${expiryHours}h`)
    .sign(getSecret())
}

export async function verifySessionToken(token: string): Promise<boolean> {
  try {
    await jwtVerify(token, getSecret())
    return true
  } catch {
    return false
  }
}

export { SESSION_COOKIE }
