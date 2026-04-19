import { test, expect } from '@playwright/test'

test.describe('Authentication', () => {
  test('visiting /dashboard unauthenticated redirects to /login', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page).toHaveURL(/\/login/)
  })

  test('visiting /dashboard/coles unauthenticated redirects to /login', async ({ page }) => {
    await page.goto('/dashboard/coles')
    await expect(page).toHaveURL(/\/login/)
  })

  test('login page renders password field and sign-in button', async ({ page }) => {
    await page.goto('/login')
    await expect(page.getByTestId('password-input')).toBeVisible()
    await expect(page.getByTestId('login-button')).toBeVisible()
  })

  test('submitting wrong password shows error message', async ({ page }) => {
    await page.goto('/login')
    await page.getByTestId('password-input').fill('wrong-password')
    await page.getByTestId('login-button').click()
    await expect(page.getByText('Invalid password')).toBeVisible()
    await expect(page).toHaveURL(/\/login/)
  })

  test('submitting correct password redirects to /dashboard', async ({ page }) => {
    await page.goto('/login')
    await page.getByTestId('password-input').fill(process.env.E2E_PASSWORD ?? 'e2e-test-password')
    await page.getByTestId('login-button').click()
    await expect(page).toHaveURL(/\/dashboard/)
  })
})
