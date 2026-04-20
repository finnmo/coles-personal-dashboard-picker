import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getListProvider } from '@/lib/list-providers'
import type { Store } from '@/types/product'

export async function POST(request: Request) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { productId } = body as Record<string, unknown>
  if (!productId || typeof productId !== 'string') {
    return NextResponse.json({ error: 'productId is required' }, { status: 400 })
  }

  const product = await db.product.findUnique({ where: { id: productId } })
  if (!product) {
    return NextResponse.json({ error: 'Product not found' }, { status: 404 })
  }

  let provider
  try {
    provider = getListProvider()
  } catch (err) {
    const message = err instanceof Error ? err.message : 'List provider unavailable'
    return NextResponse.json({ error: message }, { status: 503 })
  }

  const result = await provider.add({
    productName: product.name,
    store: product.store as Store,
  })

  return NextResponse.json(result)
}
