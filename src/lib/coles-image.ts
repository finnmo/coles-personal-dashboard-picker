const COLES_SEARCH = 'https://www.coles.com.au/search'
const COLES_CDN = 'https://cdn.productimages.coles.com.au'

// Words that carry no discriminating meaning for product matching
const STOP_WORDS = new Set([
  'a',
  'an',
  'the',
  'and',
  'or',
  'of',
  'in',
  'with',
  'for',
  'to',
  'x',
  'pk',
  'pack',
  'g',
  'kg',
  'ml',
  'l',
  'lt',
])

/**
 * Returns a set of significant lowercase words from a product name,
 * stripping punctuation, numbers, and stop words.
 */
export function significantWords(name: string): Set<string> {
  return new Set(
    name
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 1 && !STOP_WORDS.has(w) && !/^\d+$/.test(w))
  )
}

/**
 * Returns true if at least one significant word from the expected product name
 * appears in the candidate name. This is intentionally lenient — we only want
 * to catch completely wrong products (e.g. toilet cleaner instead of oat milk).
 */
export function namesOverlap(expected: string, candidate: string): boolean {
  const expectedWords = significantWords(expected)
  const candidateWords = significantWords(candidate)
  for (const word of expectedWords) {
    if (candidateWords.has(word)) return true
  }
  return false
}

/**
 * Attempts to fetch a Coles product image for the given product name.
 * Searches by barcode first (more precise), then by name.
 * The first Coles result is only accepted if its name overlaps with the
 * expected product name — this prevents totally wrong images being stored.
 *
 * Returns null if the page is blocked, the product isn't found, or any error occurs.
 */
export async function fetchColesImage(
  productName: string,
  barcode?: string | null
): Promise<string | null> {
  // Barcode search first — still validate the name to guard against wrong hits
  if (barcode) {
    const result = await tryColesSearch(barcode, productName)
    if (result) return result
  }

  return tryColesSearch(productName, productName)
}

async function tryColesSearch(query: string, expectedName: string): Promise<string | null> {
  try {
    const url = new URL(COLES_SEARCH)
    url.searchParams.set('q', query)

    const response = await fetch(url.toString(), {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml',
      },
      signal: AbortSignal.timeout(6_000),
      cache: 'no-store',
    })

    if (!response.ok) return null

    const html = await response.text()
    return extractImageFromHtml(html, expectedName)
  } catch {
    return null
  }
}

export function extractImageFromHtml(html: string, expectedName?: string): string | null {
  const jsonMatch = html.match(
    /<script id="__NEXT_DATA__" type="application\/json">([\s\S]+?)<\/script>/
  )
  if (!jsonMatch) return null

  let data: unknown
  try {
    data = JSON.parse(jsonMatch[1])
  } catch {
    return null
  }

  const results = getNestedArray(data, ['props', 'pageProps', 'searchResults', 'results'])
  if (!results || results.length === 0) return null

  const first = results[0] as Record<string, unknown>

  // Validate the result is for the right product before accepting its image
  if (expectedName) {
    const colesName = String(first.name ?? first.productName ?? '').trim()
    if (colesName && !namesOverlap(expectedName, colesName)) return null
  }

  // Prefer a direct image URL embedded in the page data
  const directUrl = extractDirectImageUrl(first)
  if (directUrl) return directUrl

  // Fall back to constructing CDN URL from the Coles stock code
  const stockcode = String(first.stockcode ?? first.id ?? '').trim()
  if (!stockcode || !/^\d+$/.test(stockcode)) return null

  return `${COLES_CDN}/productimages/${stockcode[0]}/${stockcode}.jpg`
}

function extractDirectImageUrl(product: Record<string, unknown>): string | null {
  const uris = product.imageUris
  if (!uris) return null

  if (typeof uris === 'string' && uris.startsWith('http')) return uris

  if (Array.isArray(uris)) {
    const first = uris.find((u) => typeof u === 'string' && u.startsWith('http'))
    return (first as string | undefined) ?? null
  }

  if (typeof uris === 'object' && uris !== null) {
    const map = uris as Record<string, unknown>
    for (const key of ['800w', 'large', 'medium', 'small']) {
      if (typeof map[key] === 'string' && (map[key] as string).startsWith('http')) {
        return map[key] as string
      }
    }
    const first = Object.values(map).find((v) => typeof v === 'string' && v.startsWith('http'))
    return (first as string | undefined) ?? null
  }

  return null
}

function getNestedArray(obj: unknown, path: string[]): unknown[] | null {
  let cur = obj
  for (const key of path) {
    if (typeof cur !== 'object' || cur === null) return null
    cur = (cur as Record<string, unknown>)[key]
  }
  return Array.isArray(cur) ? cur : null
}
