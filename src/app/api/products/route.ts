import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { computePriority } from '@/lib/priority'
import { fetchColesProductImage } from '@/lib/coles-api'
import type { EnrichedProduct, Store } from '@/types/product'

const VALID_STORES: Store[] = ['COLES', 'IGA']

function isValidStore(value: string): value is Store {
  return VALID_STORES.includes(value as Store)
}

function enrich(product: {
  id: string
  name: string
  imageUrl: string | null
  store: string
  colesProductId: string | null
  igaProductId: string | null
  repurchaseIntervalDays: number
  lastPurchasedAt: Date | null
  createdAt: Date
  updatedAt: Date
}): EnrichedProduct {
  const priority = computePriority({
    lastPurchasedAt: product.lastPurchasedAt,
    repurchaseIntervalDays: product.repurchaseIntervalDays,
  })
  return {
    ...product,
    store: product.store as Store,
    lastPurchasedAt: product.lastPurchasedAt?.toISOString() ?? null,
    createdAt: product.createdAt.toISOString(),
    updatedAt: product.updatedAt.toISOString(),
    ...priority,
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const storeParam = searchParams.get('store')?.toUpperCase()

  if (storeParam && !isValidStore(storeParam)) {
    return NextResponse.json(
      { error: `Invalid store. Valid values: ${VALID_STORES.join(', ')}` },
      { status: 400 }
    )
  }

  const products = await db.product.findMany({
    where: storeParam ? { store: storeParam } : undefined,
    orderBy: { createdAt: 'desc' },
  })

  const enriched = products.map(enrich).sort((a, b) => {
    if (a.isNew && !b.isNew) return 1
    if (!a.isNew && b.isNew) return -1
    return b.priorityScore - a.priorityScore
  })

  return NextResponse.json({ products: enriched })
}

export async function POST(request: Request) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { name, imageUrl, store, colesProductId, igaProductId, repurchaseIntervalDays } =
    body as Record<string, unknown>

  if (!name || typeof name !== 'string') {
    return NextResponse.json({ error: 'name is required' }, { status: 400 })
  }
  if (!store || !isValidStore(String(store))) {
    return NextResponse.json(
      { error: `store must be one of: ${VALID_STORES.join(', ')}` },
      { status: 400 }
    )
  }

  try {
    const resolvedColesId = typeof colesProductId === 'string' ? colesProductId : null
    const resolvedImageUrl =
      typeof imageUrl === 'string' && imageUrl
        ? imageUrl
        : resolvedColesId
          ? await fetchColesProductImage(resolvedColesId)
          : null

    const product = await db.product.create({
      data: {
        name,
        imageUrl: resolvedImageUrl || null,
        store: String(store),
        colesProductId: resolvedColesId,
        igaProductId: typeof igaProductId === 'string' ? igaProductId : null,
        repurchaseIntervalDays:
          typeof repurchaseIntervalDays === 'number' && repurchaseIntervalDays > 0
            ? repurchaseIntervalDays
            : 14,
      },
    })
    return NextResponse.json({ product: enrich(product) }, { status: 201 })
  } catch (err) {
    const e = err as { code?: string }
    if (e.code === 'P2002') {
      return NextResponse.json({ error: 'A product with that ID already exists' }, { status: 409 })
    }
    throw err
  }
}
