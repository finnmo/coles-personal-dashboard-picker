type SentryContext = Record<string, unknown>

export async function captureException(err: unknown, context?: SentryContext): Promise<void> {
  if (!process.env.SENTRY_DSN) return
  try {
    const Sentry = await import('@sentry/nextjs')
    if (context) Sentry.setContext('extra', context)
    Sentry.captureException(err)
  } catch {
    // Sentry is optional — never throw
  }
}
