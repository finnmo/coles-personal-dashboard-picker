import { SignJWT, jwtVerify } from 'jose'

const ALGORITHM = 'HS256'
const EXPIRY = '24h'

function getSecret(): Uint8Array {
  const secret = process.env.SESSION_SECRET
  if (!secret || secret.length < 32) {
    throw new Error('SESSION_SECRET must be set and at least 32 characters long')
  }
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
