// @vitest-environment node
import { describe, it, expect, beforeEach, afterAll } from 'vitest'
import { db } from '@/lib/db'
import { POST as addToList } from '@/app/api/list/add/route'

async function cleanDb() {
  await db.product.deleteMany()
}

function makeRequest(body: unknown) {
  return new Request('http://localhost/api/list/add', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

beforeEach(cleanDb)
afterAll(cleanDb)

describe('POST /api/list/add — apple_reminders', () => {
  // LIST_PROVIDER=apple_reminders is set in .env.test via dotenv in setup.ts

  it('returns 400 for missing productId', async () => {
    const res = await addToList(makeRequest({}))
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toMatch(/productId/i)
  })

  it('returns 400 for non-string productId', async () => {
    const res = await addToList(makeRequest({ productId: 123 }))
    expect(res.status).toBe(400)
  })

  it('returns 400 for malformed JSON', async () => {
    const req = new Request('http://localhost/api/list/add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 'not-json',
    })
    const res = await addToList(req)
    expect(res.status).toBe(400)
  })

  it('returns 404 for unknown product', async () => {
    const res = await addToList(makeRequest({ productId: 'nonexistent-id' }))
    expect(res.status).toBe(404)
  })

  it('returns 200 with ok=true for a valid product', async () => {
    const product = await db.product.create({ data: { name: 'Full Cream Milk 2L' } })
    const res = await addToList(makeRequest({ productId: product.id }))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.ok).toBe(true)
  })

  it('returns a shortcuts:// redirectUrl for apple_reminders', async () => {
    const product = await db.product.create({ data: { name: 'Cheese Block' } })
    const res = await addToList(makeRequest({ productId: product.id }))
    const body = await res.json()
    expect(body.redirectUrl).toMatch(/^shortcuts:\/\//)
  })

  it('redirectUrl contains the product name in the input param', async () => {
    const product = await db.product.create({ data: { name: 'Greek Yogurt' } })
    const res = await addToList(makeRequest({ productId: product.id }))
    const body = await res.json()
    const url = new URL(body.redirectUrl)
    const input = JSON.parse(url.searchParams.get('input')!)
    expect(input.name).toBe('Greek Yogurt')
  })
})
