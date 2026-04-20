import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

interface Params {
  params: { id: string }
}

export async function POST(_request: Request, { params }: Params) {
  const existing = await db.product.findUnique({ where: { id: params.id } })
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const product = await db.product.update({
    where: { id: params.id },
    data: { lastPurchasedAt: new Date() },
  })

  return NextResponse.json({ ok: true, lastPurchasedAt: product.lastPurchasedAt?.toISOString() })
}
