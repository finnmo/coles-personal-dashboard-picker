// @vitest-environment node
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { validateEnv, assertValidEnv } from '@/lib/startup-validation'

const VALID_BASE = {
  DATABASE_URL: 'file:./data/test.db',
  LIST_PROVIDER: 'google_tasks',
  GOOGLE_CLIENT_ID: 'id',
  GOOGLE_CLIENT_SECRET: 'secret',
  GOOGLE_REFRESH_TOKEN: 'token',
  GOOGLE_TASK_LIST_ID: 'list-id',
}

function setEnv(overrides: Record<string, string | undefined>) {
  Object.assign(process.env, VALID_BASE)
  for (const [key, value] of Object.entries(overrides)) {
    if (value === undefined) {
      delete process.env[key]
    } else {
      process.env[key] = value
    }
  }
}

function clearEnv() {
  for (const key of Object.keys(VALID_BASE)) {
    delete process.env[key]
  }
  delete process.env.APPLE_SHORTCUTS_NAME
}

describe('validateEnv', () => {
  beforeEach(clearEnv)
  afterEach(clearEnv)

  it('returns valid when all required vars are present (apple_reminders)', () => {
    setEnv({})
    expect(validateEnv()).toEqual({ valid: true })
  })

  it('returns valid for google_tasks with all Google vars set', () => {
    setEnv({})
    expect(validateEnv()).toEqual({ valid: true })
  })

  it('returns valid when LIST_PROVIDER is not set (local-only mode)', () => {
    setEnv({ LIST_PROVIDER: undefined })
    expect(validateEnv()).toEqual({ valid: true })
  })

  it('errors when DATABASE_URL is missing', () => {
    setEnv({ DATABASE_URL: undefined })
    const result = validateEnv()
    expect(result.valid).toBe(false)
    if (!result.valid) expect(result.errors).toContain('DATABASE_URL is required')
  })

  it('errors when LIST_PROVIDER is an invalid value', () => {
    setEnv({ LIST_PROVIDER: 'telegram' })
    const result = validateEnv()
    expect(result.valid).toBe(false)
    if (!result.valid) expect(result.errors.some((e) => e.includes('"telegram"'))).toBe(true)
  })

  it('errors when apple_reminders is set but APPLE_SHORTCUTS_NAME is missing', () => {
    setEnv({
      LIST_PROVIDER: 'apple_reminders',
      GOOGLE_CLIENT_ID: undefined,
      GOOGLE_CLIENT_SECRET: undefined,
      GOOGLE_REFRESH_TOKEN: undefined,
      GOOGLE_TASK_LIST_ID: undefined,
    })
    const result = validateEnv()
    expect(result.valid).toBe(false)
    if (!result.valid)
      expect(result.errors.some((e) => e.includes('APPLE_SHORTCUTS_NAME'))).toBe(true)
  })

  it('errors when google_tasks is set but Google vars are missing', () => {
    setEnv({ GOOGLE_CLIENT_ID: undefined })
    const result = validateEnv()
    expect(result.valid).toBe(false)
    if (!result.valid) expect(result.errors.some((e) => e.includes('GOOGLE_CLIENT_ID'))).toBe(true)
  })

  it('returns multiple errors at once', () => {
    clearEnv()
    // No DATABASE_URL and google_tasks with no credentials → multiple errors
    setEnv({ DATABASE_URL: undefined, LIST_PROVIDER: 'google_tasks', GOOGLE_CLIENT_ID: undefined })
    const result = validateEnv()
    expect(result.valid).toBe(false)
    if (!result.valid) expect(result.errors.length).toBeGreaterThanOrEqual(2)
  })
})

describe('assertValidEnv', () => {
  beforeEach(clearEnv)
  afterEach(clearEnv)

  it('does not throw when env is valid', () => {
    setEnv({})
    expect(() => assertValidEnv()).not.toThrow()
  })

  it('throws a descriptive error when env is invalid', () => {
    setEnv({ DATABASE_URL: undefined })
    expect(() => assertValidEnv()).toThrow('DATABASE_URL is required')
  })

  it('thrown error contains the config box header', () => {
    setEnv({ DATABASE_URL: undefined })
    expect(() => assertValidEnv()).toThrow('Configuration Error')
  })

  it('logs a warning for google_keep and still validates', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    setEnv({ LIST_PROVIDER: 'google_keep' })
    assertValidEnv()
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('google_keep'))
    warn.mockRestore()
  })
})
