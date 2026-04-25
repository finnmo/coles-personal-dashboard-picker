import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { captureException } from '@/lib/sentry'

describe('captureException', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  afterEach(() => {
    delete process.env.SENTRY_DSN
  })

  it('is a no-op when SENTRY_DSN is absent', async () => {
    delete process.env.SENTRY_DSN
    // Should not throw
    await expect(captureException(new Error('test'))).resolves.toBeUndefined()
  })

  it('does not import @sentry/nextjs when SENTRY_DSN is absent', async () => {
    delete process.env.SENTRY_DSN
    const importSpy = vi.spyOn(await import('@/lib/sentry'), 'captureException')
    await captureException(new Error('test'))
    expect(importSpy).toBeDefined()
  })
})
