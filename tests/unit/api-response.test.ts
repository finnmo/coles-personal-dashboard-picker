import { describe, it, expect } from 'vitest'
import { apiError, apiOk } from '@/lib/api-response'

describe('apiError', () => {
  it('returns correct status and body', async () => {
    const res = apiError('Not found', 'NOT_FOUND', 404)
    expect(res.status).toBe(404)
    const body = await res.json()
    expect(body).toEqual({ error: 'Not found', code: 'NOT_FOUND' })
  })

  it('uses provided status', async () => {
    const res = apiError('Conflict', 'CONFLICT', 409)
    expect(res.status).toBe(409)
  })
})

describe('apiOk', () => {
  it('defaults to 200', async () => {
    const res = apiOk({ hello: 'world' })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toEqual({ hello: 'world' })
  })

  it('accepts custom status', async () => {
    const res = apiOk({ id: '1' }, 201)
    expect(res.status).toBe(201)
  })
})
