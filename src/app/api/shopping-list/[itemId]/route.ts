import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function DELETE(_req: Request, { params }: { params: { itemId: string } }) {
  try {
    await db.shoppingListItem.delete({ where: { id: params.itemId } })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Item not found' }, { status: 404 })
  }
}
