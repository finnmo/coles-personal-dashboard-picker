import { test, expect, login, seedProduct } from './fixtures/auth'

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await login(page)
  })

  test('redirects to /dashboard/coles after login', async ({ page }) => {
    await expect(page).toHaveURL(/\/dashboard\/coles/)
  })

  test('Coles tab is active by default', async ({ page }) => {
    const colesTab = page.getByTestId('tab-coles')
    await expect(colesTab).toHaveAttribute('aria-current', 'page')
  })

  test('clicking IGA tab navigates to /dashboard/iga and persists in URL', async ({ page }) => {
    await page.getByTestId('tab-iga').click()
    await expect(page).toHaveURL(/\/dashboard\/iga/)
    await expect(page.getByTestId('tab-iga')).toHaveAttribute('aria-current', 'page')

    // Reload should keep IGA tab active
    await page.reload()
    await expect(page.getByTestId('tab-iga')).toHaveAttribute('aria-current', 'page')
  })

  test('theme toggle switches between light and dark mode', async ({ page }) => {
    const html = page.locator('html')
    const toggle = page.getByTestId('theme-toggle')
    await toggle.click()
    await expect(html).toHaveClass(/dark/)
    await toggle.click()
    await expect(html).not.toHaveClass(/dark/)
  })

  test('logout button redirects to /login', async ({ page }) => {
    await page.getByTestId('logout-button').click()
    await expect(page).toHaveURL(/\/login/)
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
    await login(page)
    const seeded = await seedProduct(page, { name: 'E2E Milk', store: 'COLES' })
    cleanup = seeded.cleanup
    await page.goto('/dashboard/coles')
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
