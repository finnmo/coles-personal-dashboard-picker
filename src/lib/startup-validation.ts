type ValidationResult = { valid: true } | { valid: false; errors: string[] }

const VALID_LIST_PROVIDERS = ['apple_reminders', 'google_tasks', 'google_keep'] as const
type ListProvider = (typeof VALID_LIST_PROVIDERS)[number]

function isValidProvider(value: string): value is ListProvider {
  return VALID_LIST_PROVIDERS.includes(value as ListProvider)
}

export function validateEnv(): ValidationResult {
  const errors: string[] = []
  const env = process.env

  if (!env.DATABASE_URL) {
    errors.push('DATABASE_URL is required')
  }

  // List provider
  const provider = env.LIST_PROVIDER
  if (!provider) {
    errors.push(`LIST_PROVIDER is required. Valid values: ${VALID_LIST_PROVIDERS.join(', ')}`)
  } else if (!isValidProvider(provider)) {
    errors.push(
      `LIST_PROVIDER "${provider}" is invalid. Valid values: ${VALID_LIST_PROVIDERS.join(', ')}`
    )
  } else {
    if (provider === 'apple_reminders') {
      if (!env.APPLE_SHORTCUTS_NAME) {
        errors.push('APPLE_SHORTCUTS_NAME is required when LIST_PROVIDER=apple_reminders')
      }
    }

    if (provider === 'google_tasks' || provider === 'google_keep') {
      if (!env.GOOGLE_CLIENT_ID)
        errors.push('GOOGLE_CLIENT_ID is required for Google list integration')
      if (!env.GOOGLE_CLIENT_SECRET)
        errors.push('GOOGLE_CLIENT_SECRET is required for Google list integration')
      if (!env.GOOGLE_REFRESH_TOKEN)
        errors.push('GOOGLE_REFRESH_TOKEN is required for Google list integration')
      if (!env.GOOGLE_TASK_LIST_ID)
        errors.push('GOOGLE_TASK_LIST_ID is required for Google list integration')

      if (provider === 'google_keep') {
        console.warn(
          '[startup] LIST_PROVIDER=google_keep has no official API. Falling back to google_tasks.'
        )
      }
    }
  }

  if (errors.length > 0) {
    return { valid: false, errors }
  }
  return { valid: true }
}

export function assertValidEnv(): void {
  const sentryEnabled = !!process.env.SENTRY_DSN
  console.info(`[startup] Sentry: ${sentryEnabled ? 'enabled' : 'disabled'}`)

  const result = validateEnv()
  if (!result.valid) {
    const message = [
      '',
      '┌─────────────────────────────────────────────────┐',
      '│  Configuration Error — app cannot start          │',
      '│  Copy .env.example to .env and fill in values.  │',
      '└─────────────────────────────────────────────────┘',
      '',
      ...result.errors.map((e) => `  ✗  ${e}`),
      '',
    ].join('\n')
    throw new Error(message)
  }
}
