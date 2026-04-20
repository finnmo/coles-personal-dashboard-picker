import { NextResponse } from 'next/server'
import { searchProducts, ColesApiError } from '@/lib/coles-api'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q')?.trim()

  if (!query) {
    return NextResponse.json({ error: 'q parameter is required' }, { status: 400 })
  }

  try {
    const results = await searchProducts(query)
    return NextResponse.json({ results })
  } catch (err) {
    if (err instanceof ColesApiError) {
      const status = err.status === 429 ? 429 : 502
      return NextResponse.json({ error: err.message }, { status })
    }
    throw err
  }
}
