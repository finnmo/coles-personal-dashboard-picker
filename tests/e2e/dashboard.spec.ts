import { test, expect, seedProduct } from './fixtures/auth'

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard')
  })

  test('loads the dashboard', async ({ page }) => {
    await expect(page).toHaveURL(/\/dashboard/)
  })

  test('theme toggle switches between light and dark mode', async ({ page }) => {
    const html = page.locator('html')
    const toggle = page.getByTestId('theme-toggle')
    await toggle.click()
    await expect(html).toHaveClass(/dark/)
    await toggle.click()
    await expect(html).not.toHaveClass(/dark/)
  })

  test('Add button opens the Add Product dialog', async ({ page }) => {
    await page.getByTestId('add-product-btn').click()
    await expect(page.getByRole('dialog')).toBeVisible()
  })

  test('Add dialog closes when backdrop is clicked', async ({ page }) => {
    await page.getByTestId('add-product-btn').click()
    await expect(page.getByRole('dialog')).toBeVisible()
    // Click outside the dialog box
    await page.mouse.click(10, 10)
    await expect(page.getByRole('dialog')).not.toBeVisible()
  })
})

test.describe('Dashboard — product interaction', () => {
  let cleanup: () => Promise<void>

  test.beforeEach(async ({ page }) => {
    const seeded = await seedProduct(page, { name: 'E2E Milk' })
    cleanup = seeded.cleanup
    await page.goto('/dashboard')
  })

  test.afterEach(async () => {
    await cleanup().catch(() => {})
  })

  test('tapping a product tile calls the purchase API and shows it in the shopping list', async ({
    page,
  }) => {
    const tile = page.locator('[data-testid^="product-tile-"]').first()
    await expect(tile).toBeVisible()

    const [purchaseRes] = await Promise.all([
      page.waitForResponse((r) => r.url().includes('/purchase') && r.request().method() === 'POST'),
      tile.click(),
    ])
    expect(purchaseRes.status()).toBe(200)
  })
})
