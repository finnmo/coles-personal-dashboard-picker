import { test as base, type Page } from '@playwright/test'

async function login(page: Page, password = process.env.E2E_PASSWORD ?? 'e2e-test-password') {
  await page.goto('/login')
  await page.getByTestId('password-input').fill(password)
  await page.getByTestId('login-button').click()
  await page.waitForURL('/dashboard/coles')
}

export const test = base.extend<{ authenticatedPage: Page }>({
  authenticatedPage: async ({ page }, use) => {
    await login(page)
    await use(page)
  },
})

export { expect } from '@playwright/test'
export { login }
