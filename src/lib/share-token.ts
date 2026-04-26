import { SignJWT, jwtVerify } from 'jose'

const ALGORITHM = 'HS256'
const EXPIRY = '24h'

// Generate a random fallback so share tokens work without any configuration.
// Tokens will be invalidated on server restart when no SHARE_SECRET is set,
// which is fine for a local-only deployment.
const fallbackSecret = crypto.randomUUID().replace(/-/g, '') + crypto.randomUUID().replace(/-/g, '')

function getSecret(): Uint8Array {
  const secret = process.env.SHARE_SECRET ?? fallbackSecret
  return new TextEncoder().encode(secret)
}

export async function createShareToken(): Promise<string> {
  return new SignJWT({ type: 'share' })
    .setProtectedHeader({ alg: ALGORITHM })
    .setIssuedAt()
    .setExpirationTime(EXPIRY)
    .sign(getSecret())
}

export async function verifyShareToken(token: string): Promise<boolean> {
  try {
    const { payload } = await jwtVerify(token, getSecret())
    return payload.type === 'share'
  } catch {
    return false
  }
}
