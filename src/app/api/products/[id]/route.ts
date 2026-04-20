import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { computePriority } from '@/lib/priority'
import type { Store } from '@/types/product'

interface Params {
  params: { id: string }
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
}) {
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

export async function GET(_request: Request, { params }: Params) {
  const product = await db.product.findUnique({ where: { id: params.id } })
  if (!product) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ product: enrich(product) })
}

export async function PATCH(request: Request, { params }: Params) {
  const existing = await db.product.findUnique({ where: { id: params.id } })
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { name, imageUrl, repurchaseIntervalDays } = body as Record<string, unknown>

  const product = await db.product.update({
    where: { id: params.id },
    data: {
      ...(typeof name === 'string' && name ? { name } : {}),
      ...(typeof imageUrl === 'string' ? { imageUrl } : {}),
      ...(typeof repurchaseIntervalDays === 'number' && repurchaseIntervalDays > 0
        ? { repurchaseIntervalDays }
        : {}),
    },
  })

  return NextResponse.json({ product: enrich(product) })
}

export async function DELETE(_request: Request, { params }: Params) {
  const existing = await db.product.findUnique({ where: { id: params.id } })
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await db.product.delete({ where: { id: params.id } })
  return NextResponse.json({ ok: true })
}
