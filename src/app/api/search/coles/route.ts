import { NextResponse } from 'next/server'
import { searchProducts, ColesApiError } from '@/lib/coles-api'
import { getCached, setCached } from '@/lib/search-cache'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q')?.trim()

  if (!query) {
    return NextResponse.json({ error: 'q parameter is required' }, { status: 400 })
  }

  const cached = getCached(query)
  if (cached) {
    return NextResponse.json({ results: cached, cached: true })
  }

  try {
    const results = await searchProducts(query)
    setCached(query, results)
    return NextResponse.json({ results })
  } catch (err) {
    if (err instanceof ColesApiError) {
      const status = err.status === 429 ? 429 : 502
      return NextResponse.json({ error: err.message }, { status })
    }
    throw err
  }
}
