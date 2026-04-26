import os from 'os'
import { createShareToken } from '@/lib/share-token'
import { createRateLimiter } from '@/lib/rate-limiter'
import { apiError, apiOk } from '@/lib/api-response'

const shareLimiter = createRateLimiter({ windowMs: 60 * 60 * 1000, maxRequests: 10 })

function getClientIp(request: Request): string {
  return request.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? 'unknown'
}

function getLanIp(): string | null {
  // Explicit override — required when running inside Docker where os.networkInterfaces()
  // only sees the bridge IP (172.17.x.x), not the host's real LAN address.
  if (process.env.SHARE_HOST) return process.env.SHARE_HOST

  const ifaces = os.networkInterfaces()
  for (const name of Object.keys(ifaces)) {
    // Skip loopback and virtual Docker/bridge interfaces
    if (
      name === 'lo' ||
      name.startsWith('docker') ||
      name.startsWith('br-') ||
      name.startsWith('veth') ||
      name.startsWith('eth')
    )
      continue
    for (const iface of ifaces[name] ?? []) {
      if (iface.family === 'IPv4' && !iface.internal) return iface.address
    }
  }
  return null
}

export async function POST(request: Request) {
  const limit = shareLimiter.check(getClientIp(request))
  if (!limit.allowed) return apiError('Too many requests', 'RATE_LIMITED', 429)

  const token = await createShareToken()
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()

  const port = process.env.PORT ?? '3000'
  const lanIp = getLanIp()
  const shareUrl = lanIp ? `http://${lanIp}:${port}/list/${token}` : null

  return apiOk({ token, expiresAt, shareUrl })
}
