import { test as base, type Page } from '@playwright/test'

async function login(page: Page, password = process.env.E2E_PASSWORD ?? 'e2e-test-password') {
  await page.goto('/login')
  await page.getByTestId('password-input').fill(password)
  await page.getByTestId('login-button').click()
  await page.waitForURL('/dashboard')
}

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

export const test = base.extend<{ authenticatedPage: Page }>({
  authenticatedPage: async ({ page }, use) => {
    await login(page)
    await use(page)
  },
})

export { expect } from '@playwright/test'
export { login, seedProduct }
