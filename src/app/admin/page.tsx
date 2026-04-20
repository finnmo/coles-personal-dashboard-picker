'use client'

import { useState } from 'react'
import { useProducts } from '@/hooks/useProducts'
import { SearchPanel } from '@/components/admin/SearchPanel'
import { ProductManager } from '@/components/admin/ProductManager'
import type { Store } from '@/types/product'
import type { ColesSearchResult } from '@/lib/coles-api'

const STORES: Store[] = ['COLES', 'IGA']

export default function AdminPage() {
  const [activeStore, setActiveStore] = useState<Store>('COLES')
  const { products, mutate } = useProducts(activeStore)

  const existingIds = new Set(
    (products ?? [])
      .map((p) => (activeStore === 'COLES' ? p.colesProductId : p.igaProductId))
      .filter(Boolean) as string[]
  )

  async function handleAdd(result: ColesSearchResult) {
    await fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: result.name,
        imageUrl: result.imageUrl || null,
        store: activeStore,
        colesProductId: activeStore === 'COLES' ? result.colesProductId : null,
        igaProductId: activeStore === 'IGA' ? result.colesProductId : null,
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

      {/* Store switcher */}
      <div className="mb-4 flex gap-2">
        {STORES.map((store) => (
          <button
            key={store}
            onClick={() => setActiveStore(store)}
            data-testid={`admin-store-${store.toLowerCase()}`}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              activeStore === store
                ? store === 'COLES'
                  ? 'bg-coles-red text-white'
                  : 'bg-iga-green text-white'
                : 'bg-muted text-muted-foreground hover:text-foreground'
            }`}
          >
            {store === 'COLES' ? 'Coles' : 'IGA'}
          </button>
        ))}
      </div>

      <section className="mb-6">
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Search &amp; Add
        </h3>
        <SearchPanel store={activeStore} onAdd={handleAdd} existingIds={existingIds} />
      </section>

      <section>
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Your {activeStore === 'COLES' ? 'Coles' : 'IGA'} Products
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
