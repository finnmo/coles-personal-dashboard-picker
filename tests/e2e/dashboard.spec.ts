import { test, expect, login } from './fixtures/auth'

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

  test('clicking IGA tab navigates to /dashboard/iga', async ({ page }) => {
    await page.getByTestId('tab-iga').click()
    await expect(page).toHaveURL(/\/dashboard\/iga/)
    await expect(page.getByTestId('tab-iga')).toHaveAttribute('aria-current', 'page')
  })

  test('Coles tab shows Coles products (mock)', async ({ page }) => {
    const grid = page.getByTestId('product-grid')
    await expect(grid).toBeVisible()
    await expect(grid.locator('[data-testid^="product-tile-"]').first()).toBeVisible()
  })

  test('IGA tab shows IGA products (mock)', async ({ page }) => {
    await page.getByTestId('tab-iga').click()
    await expect(page.getByTestId('product-grid')).toBeVisible()
  })

  test('theme toggle switches between light and dark mode', async ({ page }) => {
    const html = page.locator('html')
    const toggle = page.getByTestId('theme-toggle')

    // Click to dark
    await toggle.click()
    await expect(html).toHaveClass(/dark/)

    // Click back to light
    await toggle.click()
    await expect(html).not.toHaveClass(/dark/)
  })

  test('logout button redirects to /login', async ({ page }) => {
    await page.getByTestId('logout-button').click()
    await expect(page).toHaveURL(/\/login/)
  })
})
