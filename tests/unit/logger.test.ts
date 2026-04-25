import { describe, it, expect } from 'vitest'
import logger, { withRequestId } from '@/lib/logger'

describe('logger', () => {
  it('has required log methods', () => {
    expect(typeof logger.info).toBe('function')
    expect(typeof logger.warn).toBe('function')
    expect(typeof logger.error).toBe('function')
    expect(typeof logger.debug).toBe('function')
  })

  it('has child method', () => {
    expect(typeof logger.child).toBe('function')
  })
})

describe('withRequestId', () => {
  it('returns a child logger', () => {
    const child = withRequestId('req-123')
    expect(typeof child.info).toBe('function')
    expect(typeof child.warn).toBe('function')
    expect(typeof child.error).toBe('function')
  })
})
