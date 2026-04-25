import pino from 'pino'

// pino is Node.js-only — do not import this file from middleware (Edge runtime)
const logger = pino({
  level: process.env.LOG_LEVEL ?? (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
  ...(process.env.NODE_ENV !== 'production' && {
    transport: { target: 'pino/file', options: { destination: 1 } },
  }),
})

export default logger

export function withRequestId(requestId: string) {
  return logger.child({ requestId })
}
