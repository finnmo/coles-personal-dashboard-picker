import { test, expect, login, seedProduct } from './fixtures/auth'

test.describe('Shopping List Panel', () => {
  let cleanup: () => Promise<void>

  test.beforeEach(async ({ page }) => {
    await login(page)
    const seeded = await seedProduct(page, { name: 'E2E List Milk', store: 'COLES' })
    cleanup = seeded.cleanup
    await page.goto('/dashboard/coles')
  })

  test.afterEach(async ({ page }) => {
    await cleanup().catch(() => {})
    // Clear shopping list state
    await page.request.delete('/api/shopping-list').catch(() => {})
  })

  test('tapping a product adds it to the shopping list panel', async ({ page }) => {
    const tile = page.locator('[data-testid^="product-tile-"]').first()
    await tile.click()
    await expect(page.getByTestId('shopping-list-panel')).toBeVisible()
    await expect(page.getByTestId('shopping-list-panel')).toContainText('E2E List Milk')
  })

  test('badge count appears on shopping list FAB after adding', async ({ page }) => {
    const tile = page.locator('[data-testid^="product-tile-"]').first()
    await tile.click()
    await expect(page.getByTestId('shopping-list-badge')).toBeVisible()
  })

  test('Clear all button empties the list and hides the badge', async ({ page }) => {
    const tile = page.locator('[data-testid^="product-tile-"]').first()
    await tile.click()
    await expect(page.getByTestId('shopping-list-panel')).toBeVisible()
    await page.getByTestId('clear-list-btn').click()
    await expect(page.getByTestId('shopping-list-panel')).not.toBeVisible()
    await expect(page.getByTestId('shopping-list-badge')).not.toBeVisible()
  })

  test('/list/INVALID_TOKEN shows link expired', async ({ page }) => {
    await page.goto('/list/invalid-token')
    await expect(page.getByText(/expired|invalid/i)).toBeVisible()
  })
})
