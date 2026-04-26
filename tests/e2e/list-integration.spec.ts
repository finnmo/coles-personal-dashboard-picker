import { test, expect, seedProduct } from './fixtures/auth'

test.describe('Shopping List Sidebar', () => {
  let cleanup: () => Promise<void>

  test.beforeEach(async ({ page }) => {
    const seeded = await seedProduct(page, { name: 'E2E List Milk' })
    cleanup = seeded.cleanup
    await page.goto('/dashboard')
  })

  test.afterEach(async ({ page }) => {
    await cleanup().catch(() => {})
    await page.request.delete('/api/shopping-list').catch(() => {})
  })

  test('shopping list sidebar is always visible', async ({ page }) => {
    await expect(page.getByTestId('shopping-list-panel')).toBeVisible()
  })

  test('tapping a product adds it to the shopping list sidebar', async ({ page }) => {
    const tile = page.locator('[data-testid^="product-tile-"]').first()
    await tile.click()
    await expect(page.getByTestId('shopping-list-panel')).toContainText('E2E List Milk')
  })

  test('Clear all button empties the list', async ({ page }) => {
    const tile = page.locator('[data-testid^="product-tile-"]').first()
    await tile.click()
    await expect(page.getByTestId('shopping-list-panel')).toContainText('E2E List Milk')
    await page.getByTestId('clear-list-btn').click()
    await expect(page.getByTestId('shopping-list-panel')).not.toContainText('E2E List Milk')
  })

  test('/list/INVALID_TOKEN shows link expired', async ({ page }) => {
    await page.goto('/list/invalid-token')
    await expect(page.getByText(/expired|invalid/i)).toBeVisible()
  })
})
