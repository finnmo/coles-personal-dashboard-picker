import { test, expect, login } from './fixtures/auth'

const DAY_MS = 1000 * 60 * 60 * 24

async function seedProduct(
  page: Parameters<typeof login>[0],
  overrides: Record<string, unknown> = {}
) {
  const res = await page.request.post('/api/products', {
    data: {
      name: `E2E Product ${Date.now()}`,
      store: 'COLES',
      colesProductId: `e2e-purchase-${Date.now()}`,
      repurchaseIntervalDays: 7,
      ...overrides,
    },
  })
  if (!res.ok()) throw new Error(`Seed failed (${res.status()}): ${await res.text()}`)
  const { product } = await res.json()
  return product as { id: string; name: string }
}

async function setLastPurchased(page: Parameters<typeof login>[0], id: string, daysAgo: number) {
  const lastPurchasedAt = new Date(Date.now() - daysAgo * DAY_MS).toISOString()
  const res = await page.request.patch(`/api/products/${id}`, {
    data: { lastPurchasedAt },
  })
  if (!res.ok()) throw new Error(`Patch failed (${res.status()}): ${await res.text()}`)
}

test.describe.configure({ mode: 'serial' })

test.describe('Dashboard — purchase tracking', () => {
  let newProductId: string
  let overdueProductId: string

  test.beforeEach(async ({ page }) => {
    await login(page)

    const now = Date.now()
    // New product (never purchased)
    const newP = await seedProduct(page, { name: `New Item ${now}` })
    newProductId = newP.id

    // Old purchase: interval=7 days, purchased 14 days ago → score=2, isOverdue=true
    const overdueP = await seedProduct(page, {
      name: `Old Yogurt ${now}`,
      repurchaseIntervalDays: 7,
    })
    overdueProductId = overdueP.id
    await setLastPurchased(page, overdueProductId, 14)

    await page.goto('/dashboard/coles')
  })

  test.afterEach(async ({ page }) => {
    await page.request.delete(`/api/products/${newProductId}`).catch(() => {})
    await page.request.delete(`/api/products/${overdueProductId}`).catch(() => {})
  })

  test('overdue product shows "Overdue" badge', async ({ page }) => {
    const badge = page
      .locator(`[data-testid="product-tile-${overdueProductId}"]`)
      .getByTestId('priority-badge')
    await expect(badge).toBeVisible()
    await expect(badge).toHaveText('Overdue')
  })

  test('new product shows "New" badge', async ({ page }) => {
    const badge = page
      .locator(`[data-testid="product-tile-${newProductId}"]`)
      .getByTestId('priority-badge')
    await expect(badge).toBeVisible()
    await expect(badge).toHaveText('New')
  })

  test('overdue product appears before new product in the grid', async ({ page }) => {
    const grid = page.getByTestId('product-grid')
    await expect(grid).toBeVisible()

    const tiles = grid.locator('[data-testid^="product-tile-"]')
    const tileIds = await tiles.evaluateAll((els) =>
      els.map((el) => el.getAttribute('data-testid')?.replace('product-tile-', '') ?? '')
    )

    const overdueIndex = tileIds.indexOf(overdueProductId)
    const newIndex = tileIds.indexOf(newProductId)

    expect(overdueIndex).toBeGreaterThanOrEqual(0)
    expect(newIndex).toBeGreaterThanOrEqual(0)
    expect(overdueIndex).toBeLessThan(newIndex)
  })

  test('tapping purchase button updates to done state', async ({ page }) => {
    const purchaseBtn = page.getByTestId(`purchase-btn-${overdueProductId}`)
    await expect(purchaseBtn).toBeVisible()
    await purchaseBtn.click()

    // Button enters done (green check) state
    await expect(purchaseBtn.locator('svg')).toBeVisible()
    // The button is in done state (green background)
    await expect(purchaseBtn).toHaveClass(/bg-green-500/)
  })

  test('purchasing an overdue product resets its badge away from Overdue', async ({ page }) => {
    await page.getByTestId(`purchase-btn-${overdueProductId}`).click()

    // After SWR revalidation, lastPurchasedAt = now → score ≈ 0 → badge no longer Overdue
    const badge = page
      .locator(`[data-testid="product-tile-${overdueProductId}"]`)
      .getByTestId('priority-badge')
    await expect(badge).not.toHaveText('Overdue', { timeout: 8000 })
  })
})
