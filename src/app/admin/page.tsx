'use client'

import { useProducts } from '@/hooks/useProducts'
import { SearchPanel } from '@/components/admin/SearchPanel'
import { ProductManager } from '@/components/admin/ProductManager'
import type { OffSearchResult } from '@/lib/off-api'

export default function AdminPage() {
  const { products, mutate } = useProducts()

  const existingIds = new Set(
    (products ?? []).map((p) => p.offProductId).filter(Boolean) as string[]
  )

  async function handleAdd(result: OffSearchResult) {
    await fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: result.name,
        imageUrl: result.imageUrl || null,
        offProductId: result.offProductId,
      }),
    })
    await mutate()
  }

  async function handleRemove(id: string) {
    await fetch(`/api/products/${id}`, { method: 'DELETE' })
    await mutate()
  }

  async function handleUpdateInterval(id: string, days: number) {
    await fetch(`/api/products/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ repurchaseIntervalDays: days }),
    })
    await mutate()
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-foreground">Admin Panel</h2>
        <p className="mt-1 text-sm text-muted-foreground">Manage products on your dashboard.</p>
      </div>

      <section className="mb-6">
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Search &amp; Add
        </h3>
        <SearchPanel onAdd={handleAdd} existingIds={existingIds} />
      </section>

      <section>
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Your Products
        </h3>
        <ProductManager
          products={products ?? []}
          onRemove={handleRemove}
          onUpdateInterval={handleUpdateInterval}
        />
      </section>
    </div>
  )
}
