import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({ error: 'IGA search not yet implemented' }, { status: 501 })
}
