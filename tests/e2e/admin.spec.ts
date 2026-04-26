import { test, expect } from './fixtures/auth'
import type { Page } from '@playwright/test'

function makeMockResult(offProductId: string) {
  return {
    offProductId,
    name: 'Full Cream Milk 2L',
    brand: 'Pauls',
    quantity: '2L',
    imageUrl: null,
  }
}

async function cleanProductByOffId(page: Page, offProductId: string) {
  const res = await page.request.get('/api/products')
  const { products } = await res.json()
  const found = products.find(
    (p: { offProductId: string; id: string }) => p.offProductId === offProductId
  )
  if (found) {
    await page.request.delete(`/api/products/${found.id}`)
  }
}

test.describe('Admin Panel', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/admin')
  })

  test('shows admin panel heading', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Admin Panel' })).toBeVisible()
  })

  test('search input is visible', async ({ page }) => {
    await expect(page.getByTestId('admin-search-input')).toBeVisible()
  })
})

test.describe('Admin Search', () => {
  let searchProductId: string

  test.beforeEach(async ({ page }) => {
    searchProductId = `900${Date.now()}`

    await page.route('/api/search*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ results: [makeMockResult(searchProductId)] }),
      })
    })

    await page.goto('/admin')
  })

  test.afterEach(async ({ page }) => {
    await cleanProductByOffId(page, searchProductId)
  })

  test('shows search results after typing', async ({ page }) => {
    await page.getByTestId('admin-search-input').fill('milk')
    await expect(page.getByText('Full Cream Milk 2L')).toBeVisible()
  })

  test('shows add button for search results', async ({ page }) => {
    await page.getByTestId('admin-search-input').fill('milk')
    await expect(page.getByTestId(`add-btn-${searchProductId}`)).toBeVisible()
  })

  test('adding a product updates the product list', async ({ page }) => {
    await page.getByTestId('admin-search-input').fill('milk')
    await page.getByTestId(`add-btn-${searchProductId}`).click()

    await expect(page.getByTestId('product-manager')).toContainText('Full Cream Milk 2L')
  })

  test('add button is disabled for already-added products', async ({ page }) => {
    await page.getByTestId('admin-search-input').fill('milk')
    await page.getByTestId(`add-btn-${searchProductId}`).click()

    // Clear and search again — button should now be disabled
    await page.getByTestId('admin-search-input').fill('')
    await page.getByTestId('admin-search-input').fill('milk')

    await expect(page.getByTestId(`add-btn-${searchProductId}`)).toBeDisabled()
  })
})

test.describe.configure({ mode: 'serial' })

test.describe('Admin Product Management', () => {
  let productId: string

  test.beforeEach(async ({ page }) => {
    const res = await page.request.post('/api/products', {
      data: {
        name: 'E2E Test Milk',
        repurchaseIntervalDays: 14,
      },
    })
    if (!res.ok()) {
      const body = await res.text()
      throw new Error(`Failed to seed product (${res.status()}): ${body}`)
    }
    const body = await res.json()
    productId = body.product.id

    await page.goto('/admin')
  })

  test.afterEach(async ({ page }) => {
    if (productId) {
      await page.request.delete(`/api/products/${productId}`).catch(() => {})
    }
  })

  test('seeded product appears in the product list', async ({ page }) => {
    await expect(page.getByTestId('product-manager')).toContainText('E2E Test Milk')
  })

  test('removing a product removes it from the list', async ({ page }) => {
    await page.getByTestId(`remove-btn-${productId}`).click()
    await expect(page.getByTestId(`managed-product-${productId}`)).not.toBeAttached()
    productId = ''
  })

  test('editing repurchase interval updates the value', async ({ page }) => {
    await page.getByTestId(`interval-edit-${productId}`).click()
    await page.getByTestId(`interval-input-${productId}`).fill('21')
    await page.getByTestId(`interval-save-${productId}`).click()

    await expect(page.getByTestId(`interval-edit-${productId}`)).toContainText('21d')
  })
})
