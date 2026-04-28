'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import Image from 'next/image'
import useSWR, { useSWRConfig } from 'swr'
import { Trash2, Share2, AlignLeft, Smartphone, ChevronLeft, Check } from 'lucide-react'
import { QrCode } from './QrCode'

type ShoppingListProduct = {
  id: string
  name: string
  imageUrl: string | null
}

type ShoppingListItemData = {
  id: string
  productId: string
  addedAt: string
  product: ShoppingListProduct
}

type ListResponse = {
  items: ShoppingListItemData[]
  synced?: boolean
  error?: string
  newItems?: { id: string; name: string }[]
}

const fetcher = (url: string) => fetch(url).then((r) => r.json())

const SWIPE_THRESHOLD = 70

// ---------------------------------------------------------------------------
// Swipeable list item
// ---------------------------------------------------------------------------

interface SwipeableItemProps {
  item: ShoppingListItemData
  onRemove: (id: string) => void
}

function SwipeableItem({ item, onRemove }: SwipeableItemProps) {
  const [translateX, setTranslateX] = useState(0)
  const [dismissed, setDismissed] = useState(false)
  const startX = useRef<number | null>(null)
  const startY = useRef<number | null>(null)
  const swiping = useRef(false)

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    startX.current = e.clientX
    startY.current = e.clientY
    swiping.current = false
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
  }, [])

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (startX.current === null || startY.current === null) return
    const dx = e.clientX - startX.current
    const dy = e.clientY - startY.current
    if (!swiping.current && Math.abs(dx) < 8 && Math.abs(dy) < 8) return
    if (!swiping.current) {
      if (Math.abs(dy) > Math.abs(dx)) {
        startX.current = null
        return
      }
      swiping.current = true
    }
    setTranslateX(Math.min(0, dx))
  }, [])

  const onPointerUp = useCallback(() => {
    if (startX.current === null) return
    if (translateX < -SWIPE_THRESHOLD) {
      setDismissed(true)
      setTimeout(() => onRemove(item.id), 240)
    } else {
      setTranslateX(0)
    }
    startX.current = null
    startY.current = null
    swiping.current = false
  }, [translateX, item.id, onRemove])

  return (
    <li
      className="relative overflow-hidden"
      style={
        dismissed
          ? { maxHeight: 0, opacity: 0, transition: 'max-height 0.24s ease, opacity 0.24s ease' }
          : { maxHeight: '80px' }
      }
    >
      {/* Swipe-to-delete red background */}
      <div className="absolute inset-y-0 right-0 flex items-center justify-end bg-red-500 pr-4 rounded-r-lg">
        <Check className="h-5 w-5 text-white" />
      </div>

      <div
        className="relative flex items-center space-x-3 py-2.5 bg-card touch-pan-y"
        style={{
          transform: `translateX(${translateX}px)`,
          transition: startX.current === null ? 'transform 0.18s ease' : undefined,
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        data-testid={`shopping-item-${item.id}`}
      >
        {/* Product image */}
        <div className="relative h-11 w-11 flex-shrink-0 overflow-hidden rounded-lg bg-muted">
          {item.product.imageUrl ? (
            <Image
              src={item.product.imageUrl}
              alt={item.product.name}
              fill
              sizes="44px"
              className="object-contain p-1"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-lg">🛒</div>
          )}
        </div>

        {/* Name */}
        <p className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">
          {item.product.name}
        </p>

        {/* Remove button */}
        <button
          onClick={() => onRemove(item.id)}
          aria-label={`Mark ${item.product.name} as done`}
          className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full text-muted-foreground active:bg-green-100 active:text-green-600 transition-colors"
        >
          <Check className="h-5 w-5" />
        </button>
      </div>
    </li>
  )
}

// ---------------------------------------------------------------------------
// Share modal (same two-step flow as before)
// ---------------------------------------------------------------------------

type ShareView = 'choose' | 'text' | 'link'

interface ShareModalProps {
  items: ShoppingListItemData[]
  onClose: () => void
}

function ShareModal({ items, onClose }: ShareModalProps) {
  const [view, setView] = useState<ShareView>('choose')
  const [shareUrl, setShareUrl] = useState<string | null>(null)
  const [linkLoading, setLinkLoading] = useState(false)

  function buildListText() {
    return ['Shopping List', ...items.map((i) => `• ${i.product.name}`)].join('\n')
  }

  async function openLinkQr() {
    setView('link')
    if (shareUrl) return
    setLinkLoading(true)
    try {
      const res = await fetch('/api/shopping-list/share', { method: 'POST' })
      if (!res.ok) return
      const { token, shareUrl: lanUrl } = await res.json()
      setShareUrl(lanUrl ?? `${window.location.origin}/list/${token}`)
    } finally {
      setLinkLoading(false)
    }
  }

  return (
    <>
      <div className="fixed inset-0 z-[60] bg-black/70" onClick={onClose} aria-hidden />
      <div className="fixed inset-0 z-[70] flex items-center justify-center p-6 pointer-events-none">
        <div
          className="pointer-events-auto flex flex-col items-center space-y-5 rounded-3xl bg-card p-8 shadow-2xl w-full max-w-sm"
          onClick={(e) => e.stopPropagation()}
        >
          {view === 'choose' && (
            <>
              <h2 className="text-2xl font-bold text-foreground">Share List</h2>
              <button
                onClick={() => setView('text')}
                className="flex items-center space-x-4 w-full rounded-2xl border border-border px-5 py-4 text-left active:bg-muted transition-colors"
              >
                <AlignLeft className="h-6 w-6 shrink-0 text-primary" />
                <div>
                  <p className="font-semibold text-foreground">Plain list</p>
                  <p className="text-sm text-muted-foreground">Any camera reads it as text</p>
                </div>
              </button>
              <button
                onClick={openLinkQr}
                className="flex items-center space-x-4 w-full rounded-2xl border border-border px-5 py-4 text-left active:bg-muted transition-colors"
              >
                <Smartphone className="h-6 w-6 shrink-0 text-primary" />
                <div>
                  <p className="font-semibold text-foreground">Save to phone</p>
                  <p className="text-sm text-muted-foreground">Opens Reminders, Notes &amp; more</p>
                </div>
              </button>
              <button
                onClick={onClose}
                className="py-2 text-sm text-muted-foreground underline-offset-4 hover:underline"
              >
                Cancel
              </button>
            </>
          )}

          {view === 'text' && (
            <>
              <h2 className="text-xl font-bold text-foreground">Plain List</h2>
              <QrCode value={buildListText()} size={220} />
              <p className="text-sm text-muted-foreground text-center">Scan with any camera app</p>
              <div className="flex w-full items-center justify-between">
                <button
                  onClick={() => setView('choose')}
                  className="flex items-center space-x-1 py-2 text-sm text-muted-foreground hover:underline"
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span>Back</span>
                </button>
                <button
                  onClick={onClose}
                  className="py-2 text-sm text-muted-foreground hover:underline"
                >
                  Close
                </button>
              </div>
            </>
          )}

          {view === 'link' && (
            <>
              <h2 className="text-xl font-bold text-foreground">Save to Phone</h2>
              {linkLoading || !shareUrl ? (
                <div className="flex h-[220px] w-[220px] items-center justify-center">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-border border-t-primary" />
                </div>
              ) : (
                <QrCode value={shareUrl} size={220} />
              )}
              <p className="text-sm text-muted-foreground text-center">
                Scan to open save options on your phone
              </p>
              <div className="flex w-full items-center justify-between">
                <button
                  onClick={() => setView('choose')}
                  className="flex items-center space-x-1 py-2 text-sm text-muted-foreground hover:underline"
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span>Back</span>
                </button>
                <button
                  onClick={onClose}
                  className="py-2 text-sm text-muted-foreground hover:underline"
                >
                  Close
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  )
}

// ---------------------------------------------------------------------------
// Main sidebar
// ---------------------------------------------------------------------------

export function ShoppingListSidebar() {
  const [showShare, setShowShare] = useState(false)
  const [syncedNames, setSyncedNames] = useState<string[]>([])
  const { mutate: globalMutate } = useSWRConfig()

  const { data, mutate } = useSWR<ListResponse>('/api/shopping-list', fetcher, {
    refreshInterval: 30_000,
    revalidateOnFocus: true,
  })

  // When the poll returns new externally-added items, notify and refresh the product grid
  useEffect(() => {
    if (!data?.newItems?.length) return
    setSyncedNames(data.newItems.map((i) => i.name))
    globalMutate('/api/products')
    const t = setTimeout(() => setSyncedNames([]), 5_000)
    return () => clearTimeout(t)
  }, [data?.newItems, globalMutate])

  const items = data?.items ?? []
  const syncError = data?.error === 'provider_unavailable'

  async function removeItem(itemId: string) {
    // Optimistic update
    mutate(
      (current) =>
        current ? { ...current, items: current.items.filter((i) => i.id !== itemId) } : current,
      false
    )
    await fetch(`/api/shopping-list/${itemId}`, { method: 'DELETE' })
    mutate()
  }

  async function clearAll() {
    mutate((current) => (current ? { ...current, items: [] } : current), false)
    await fetch('/api/shopping-list', { method: 'DELETE' })
    mutate()
  }

  return (
    <aside
      className="flex w-72 flex-shrink-0 flex-col border-l border-border bg-card"
      data-testid="shopping-list-panel"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">
            Shopping List
          </h2>
          {syncError && (
            <p className="text-xs text-amber-500 mt-0.5">List provider offline — showing cache</p>
          )}
        </div>
        <div className="flex items-center space-x-1">
          {items.length > 0 && (
            <>
              <button
                onClick={() => setShowShare(true)}
                aria-label="Share list"
                data-testid="share-list-btn"
                className="flex h-11 w-11 items-center justify-center rounded-full text-muted-foreground active:bg-muted transition-colors"
              >
                <Share2 className="h-5 w-5" />
              </button>
              <button
                onClick={clearAll}
                data-testid="clear-list-btn"
                aria-label="Clear list"
                className="flex h-11 w-11 items-center justify-center rounded-full text-muted-foreground active:bg-muted active:text-red-500 transition-colors"
              >
                <Trash2 className="h-5 w-5" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Inbound sync toast */}
      {syncedNames.length > 0 && (
        <div className="mx-3 mt-2 rounded-lg bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 px-3 py-2 text-xs text-green-700 dark:text-green-300">
          Added from your list: <span className="font-medium">{syncedNames.join(', ')}</span>
        </div>
      )}

      {/* List */}
      <div className="flex-1 overflow-y-auto px-3">
        {items.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center py-16 text-center">
            <span className="text-4xl">🛒</span>
            <p className="mt-3 text-sm font-medium text-muted-foreground">Nothing added yet</p>
            <p className="mt-1 text-xs text-muted-foreground">Tap a product to add it</p>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {items.map((item) => (
              <SwipeableItem key={item.id} item={item} onRemove={removeItem} />
            ))}
          </ul>
        )}
      </div>

      {/* Footer — item count + sync status */}
      {items.length > 0 && (
        <div className="border-t border-border px-4 py-2">
          <p className="text-xs text-muted-foreground">
            {items.length} item{items.length !== 1 ? 's' : ''}
            {data?.synced && <span className="ml-2 text-green-600">· synced</span>}
          </p>
        </div>
      )}

      {/* Share modal */}
      {showShare && <ShareModal items={items} onClose={() => setShowShare(false)} />}
    </aside>
  )
}
