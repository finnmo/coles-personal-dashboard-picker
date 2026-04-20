// @vitest-environment node
import { describe, it, expect, beforeEach, afterAll } from 'vitest'
import { db } from '@/lib/db'

import { GET as listProducts, POST as createProduct } from '@/app/api/products/route'
import {
  GET as getProduct,
  PATCH as updateProduct,
  DELETE as deleteProduct,
} from '@/app/api/products/[id]/route'
import { POST as recordPurchase } from '@/app/api/products/[id]/purchase/route'

async function cleanDb() {
  await db.product.deleteMany()
}

function makeRequest(method: string, url: string, body?: unknown) {
  return new Request(url, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  })
}

const params = (id: string) => ({ params: { id } })

beforeEach(cleanDb)
afterAll(cleanDb)

describe('POST /api/products', () => {
  it('creates a product and returns 201', async () => {
    const req = makeRequest('POST', 'http://localhost/api/products', {
      name: 'Full Cream Milk 2L',
      store: 'COLES',
      colesProductId: 'coles-123',
    })
    const res = await createProduct(req)
    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.product.name).toBe('Full Cream Milk 2L')
    expect(body.product.store).toBe('COLES')
    expect(body.product.repurchaseIntervalDays).toBe(14)
    expect(body.product.isNew).toBe(true)
  })

  it('returns 400 when name is missing', async () => {
    const req = makeRequest('POST', 'http://localhost/api/products', { store: 'COLES' })
    const res = await createProduct(req)
    expect(res.status).toBe(400)
  })

  it('returns 400 for invalid store', async () => {
    const req = makeRequest('POST', 'http://localhost/api/products', {
      name: 'Milk',
      store: 'WOOLWORTHS',
    })
    const res = await createProduct(req)
    expect(res.status).toBe(400)
  })

  it('returns 400 for malformed JSON', async () => {
    const req = new Request('http://localhost/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 'not-json',
    })
    const res = await createProduct(req)
    expect(res.status).toBe(400)
  })

  it('returns 409 when colesProductId already exists', async () => {
    const body = { name: 'Milk', store: 'COLES', colesProductId: 'dupe-id' }
    await createProduct(makeRequest('POST', 'http://localhost/api/products', body))
    const res = await createProduct(makeRequest('POST', 'http://localhost/api/products', body))
    expect(res.status).toBe(409)
  })
})

describe('GET /api/products', () => {
  it('returns all products when no store filter', async () => {
    await db.product.createMany({
      data: [
        { name: 'Milk', store: 'COLES' },
        { name: 'Bread', store: 'IGA' },
      ],
    })
    const req = makeRequest('GET', 'http://localhost/api/products')
    const res = await listProducts(req)
    const body = await res.json()
    expect(body.products).toHaveLength(2)
  })

  it('filters by store', async () => {
    await db.product.createMany({
      data: [
        { name: 'Milk', store: 'COLES' },
        { name: 'Bread', store: 'IGA' },
      ],
    })
    const req = makeRequest('GET', 'http://localhost/api/products?store=COLES')
    const res = await listProducts(req)
    const body = await res.json()
    expect(body.products).toHaveLength(1)
    expect(body.products[0].store).toBe('COLES')
  })

  it('returns 400 for invalid store filter', async () => {
    const req = makeRequest('GET', 'http://localhost/api/products?store=INVALID')
    const res = await listProducts(req)
    expect(res.status).toBe(400)
  })

  it('sorts overdue products before new ones', async () => {
    const overdue = await db.product.create({
      data: {
        name: 'Overdue Item',
        store: 'COLES',
        repurchaseIntervalDays: 7,
        lastPurchasedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
      },
    })
    await db.product.create({ data: { name: 'New Item', store: 'COLES' } })

    const req = makeRequest('GET', 'http://localhost/api/products?store=COLES')
    const res = await listProducts(req)
    const body = await res.json()

    expect(body.products[0].id).toBe(overdue.id)
    expect(body.products[0].isOverdue).toBe(true)
    expect(body.products[body.products.length - 1].isNew).toBe(true)
  })
})

describe('GET /api/products/[id]', () => {
  it('returns the product', async () => {
    const created = await db.product.create({ data: { name: 'Eggs', store: 'COLES' } })
    const req = makeRequest('GET', `http://localhost/api/products/${created.id}`)
    const res = await getProduct(req, params(created.id))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.product.name).toBe('Eggs')
  })

  it('returns 404 for unknown id', async () => {
    const req = makeRequest('GET', 'http://localhost/api/products/nonexistent')
    const res = await getProduct(req, params('nonexistent'))
    expect(res.status).toBe(404)
  })
})

describe('PATCH /api/products/[id]', () => {
  it('updates repurchaseIntervalDays', async () => {
    const created = await db.product.create({ data: { name: 'Cheese', store: 'COLES' } })
    const req = makeRequest('PATCH', `http://localhost/api/products/${created.id}`, {
      repurchaseIntervalDays: 21,
    })
    const res = await updateProduct(req, params(created.id))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.product.repurchaseIntervalDays).toBe(21)
  })

  it('updates name', async () => {
    const created = await db.product.create({ data: { name: 'Old Name', store: 'IGA' } })
    const req = makeRequest('PATCH', `http://localhost/api/products/${created.id}`, {
      name: 'New Name',
    })
    const res = await updateProduct(req, params(created.id))
    const body = await res.json()
    expect(body.product.name).toBe('New Name')
  })

  it('returns 404 for unknown id', async () => {
    const req = makeRequest('PATCH', 'http://localhost/api/products/ghost', { name: 'X' })
    const res = await updateProduct(req, params('ghost'))
    expect(res.status).toBe(404)
  })
})

describe('DELETE /api/products/[id]', () => {
  it('deletes the product and returns ok', async () => {
    const created = await db.product.create({ data: { name: 'Delete Me', store: 'COLES' } })
    const req = makeRequest('DELETE', `http://localhost/api/products/${created.id}`)
    const res = await deleteProduct(req, params(created.id))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.ok).toBe(true)

    const gone = await db.product.findUnique({ where: { id: created.id } })
    expect(gone).toBeNull()
  })

  it('returns 404 for unknown id', async () => {
    const req = makeRequest('DELETE', 'http://localhost/api/products/nobody')
    const res = await deleteProduct(req, params('nobody'))
    expect(res.status).toBe(404)
  })
})

describe('POST /api/products/[id]/purchase', () => {
  it('sets lastPurchasedAt to now', async () => {
    const before = new Date()
    const created = await db.product.create({ data: { name: 'Yogurt', store: 'COLES' } })
    expect(created.lastPurchasedAt).toBeNull()

    const req = makeRequest('POST', `http://localhost/api/products/${created.id}/purchase`)
    const res = await recordPurchase(req, params(created.id))
    expect(res.status).toBe(200)

    const updated = await db.product.findUnique({ where: { id: created.id } })
    expect(updated!.lastPurchasedAt).not.toBeNull()
    expect(updated!.lastPurchasedAt!.getTime()).toBeGreaterThanOrEqual(before.getTime())
  })

  it('returns 404 for unknown id', async () => {
    const req = makeRequest('POST', 'http://localhost/api/products/ghost/purchase')
    const res = await recordPurchase(req, params('ghost'))
    expect(res.status).toBe(404)
  })
})
