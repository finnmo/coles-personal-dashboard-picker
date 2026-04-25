import { db } from '@/lib/db'
import { apiOk, apiError } from '@/lib/api-response'
import logger from '@/lib/logger'

export async function GET(request: Request) {
  const requestId = request.headers.get('x-request-id') ?? undefined
  const log = requestId ? logger.child({ requestId }) : logger

  try {
    await db.$queryRaw`SELECT 1`
    log.info({ db: 'ok' }, 'health check passed')
    return apiOk({ status: 'ok', db: 'ok', timestamp: new Date().toISOString() })
  } catch (err) {
    log.error({ err }, 'health check: db ping failed')
    return apiError('Database unavailable', 'SERVER_ERROR', 503)
  }
}
