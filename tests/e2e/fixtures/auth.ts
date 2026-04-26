import { test as base, type Page } from '@playwright/test'

async function seedProduct(
  page: Page,
  data: { name: string; repurchaseIntervalDays?: number }
): Promise<{ id: string; cleanup: () => Promise<void> }> {
  const res = await page.request.post('/api/products', {
    data: { repurchaseIntervalDays: 14, ...data },
  })
  if (!res.ok()) {
    const body = await res.text()
    throw new Error(`seedProduct failed (${res.status()}): ${body}`)
  }
  const { product } = await res.json()
  return {
    id: product.id,
    cleanup: () => page.request.delete(`/api/products/${product.id}`).then(() => undefined),
  }
}

export const test = base
export { expect } from '@playwright/test'
export { seedProduct }
