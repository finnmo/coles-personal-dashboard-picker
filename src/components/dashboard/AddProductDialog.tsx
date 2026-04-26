'use client'

import { useState, useEffect, useRef } from 'react'
import { X, Settings2 } from 'lucide-react'
import { SearchPanel } from '@/components/admin/SearchPanel'
import { ProductManager } from '@/components/admin/ProductManager'
import { useProducts } from '@/hooks/useProducts'
import type { StoreSearchResult } from '@/lib/store-search'

interface AddProductDialogProps {
  open: boolean
  onClose: () => void
}

type Tab = 'search' | 'manage'

export function AddProductDialog({ open, onClose }: AddProductDialogProps) {
  const [activeTab, setActiveTab] = useState<Tab>('search')
  const [closing, setClosing] = useState(false)
  const [maxHeight, setMaxHeight] = useState<string>('85vh')
  const { products, mutate } = useProducts()
  const dialogRef = useRef<HTMLDivElement>(null)

  // Track visual viewport so the dialog stays above the iPad keyboard
  useEffect(() => {
    if (!open) return

    const vv = window.visualViewport
    if (!vv) return

    function update() {
      // 48px total vertical padding (24px each side)
      setMaxHeight(`${vv!.height - 48}px`)
    }

    update()
    vv.addEventListener('resize', update)
    vv.addEventListener('scroll', update)
    return () => {
      vv.removeEventListener('resize', update)
      vv.removeEventListener('scroll', update)
    }
  }, [open])

  useEffect(() => {
    if (open) {
      setActiveTab('search')
      setClosing(false)
    }
  }, [open])

  function close() {
    setClosing(true)
    setTimeout(() => {
      onClose()
      setClosing(false)
    }, 180)
  }

  const existingIds = new Set(
    (products ?? []).map((p) => p.offProductId).filter(Boolean) as string[]
  )

  async function handleAdd(result: StoreSearchResult) {
    await fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: result.name,
        imageUrl: result.imageUrl || null,
        offProductId: result.externalId,
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

  if (!open) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
        onClick={close}
        aria-hidden
      />

      {/* Centering container — uses flex so the dialog sits in the middle of the visible viewport */}
      <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center p-6">
        <div
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-label="Add products"
          style={{ maxHeight }}
          onClick={(e) => e.stopPropagation()}
          className={`pointer-events-auto flex w-full max-w-lg flex-col rounded-2xl bg-card shadow-2xl ${
            closing ? 'animate-dialog-out' : 'animate-dialog-in'
          }`}
        >
          {/* Header */}
          <div className="flex flex-shrink-0 items-center justify-between px-5 pt-5 pb-3">
            <h2 className="text-lg font-bold text-foreground">Add Products</h2>
            <button
              onClick={close}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-muted active:bg-muted/70 transition-colors"
              aria-label="Close"
            >
              <X className="h-5 w-5 text-foreground" />
            </button>
          </div>

          {/* Tab controls */}
          <div className="flex flex-shrink-0 px-5 pb-3">
            <div className="flex rounded-xl bg-muted p-1 space-x-1">
              <button
                onClick={() => setActiveTab('search')}
                className={`rounded-lg px-4 py-1.5 text-sm font-semibold transition-colors ${
                  activeTab === 'search'
                    ? 'bg-card text-foreground shadow-sm'
                    : 'text-muted-foreground active:text-foreground'
                }`}
              >
                Search
              </button>
              <button
                onClick={() => setActiveTab('manage')}
                className={`flex items-center space-x-1.5 rounded-lg px-4 py-1.5 text-sm font-semibold transition-colors ${
                  activeTab === 'manage'
                    ? 'bg-card text-foreground shadow-sm'
                    : 'text-muted-foreground active:text-foreground'
                }`}
              >
                <Settings2 className="h-3.5 w-3.5" />
                Manage
              </button>
            </div>
          </div>

          {/* Scrollable content */}
          <div className="flex-1 overflow-y-auto px-5 pt-1 pb-6">
            {activeTab === 'search' ? (
              <SearchPanel onAdd={handleAdd} existingIds={existingIds} />
            ) : (
              <ProductManager
                products={products ?? []}
                onRemove={handleRemove}
                onUpdateInterval={handleUpdateInterval}
              />
            )}
          </div>
        </div>
      </div>
    </>
  )
}
