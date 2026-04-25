'use client'

import { useState, useRef, useCallback } from 'react'
import Image from 'next/image'
import useSWR from 'swr'
import { ShoppingCart, X, Trash2, Share2, Copy, Check } from 'lucide-react'
import { QrCode } from './QrCode'

type ShoppingListProduct = {
  id: string
  name: string
  imageUrl: string | null
  store: string
}

type ShoppingListItemData = {
  id: string
  productId: string
  addedAt: string
  product: ShoppingListProduct
}

const fetcher = (url: string) => fetch(url).then((r) => r.json())

const SWIPE_THRESHOLD = 80

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
      setTimeout(() => onRemove(item.id), 260)
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
      style={{
        transition: dismissed
          ? 'transform 0.26s ease, opacity 0.26s ease, max-height 0.26s ease'
          : undefined,
        ...(dismissed ? { maxHeight: 0, opacity: 0 } : { maxHeight: '200px' }),
      }}
    >
      <div className="absolute inset-y-0 right-0 flex items-center justify-end bg-red-500 pr-5 rounded-r-lg">
        <X className="h-5 w-5 text-white" />
      </div>

      <div
        className="relative flex items-center gap-3 py-3 bg-card touch-pan-y"
        style={{
          transform: `translateX(${translateX}px)`,
          transition: startX.current === null ? 'transform 0.2s ease' : undefined,
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        data-testid={`shopping-item-${item.id}`}
      >
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
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-foreground">{item.product.name}</p>
          <p className="text-xs text-muted-foreground">{item.product.store}</p>
        </div>
        <button
          onClick={() => onRemove(item.id)}
          aria-label={`Remove ${item.product.name}`}
          className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-muted-foreground active:bg-muted active:text-red-500 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
    </li>
  )
}

export function ShoppingListPanel() {
  const [open, setOpen] = useState(false)
  const [closing, setClosing] = useState(false)
  const [shareUrl, setShareUrl] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [sharing, setSharing] = useState(false)

  const { data, mutate } = useSWR<{ items: ShoppingListItemData[] }>(
    open ? '/api/shopping-list' : null,
    fetcher,
    { refreshInterval: 0 }
  )

  const items = data?.items ?? []

  function close() {
    setClosing(true)
    setTimeout(() => {
      setOpen(false)
      setClosing(false)
      setShareUrl(null)
    }, 240)
  }

  async function removeItem(itemId: string) {
    await fetch(`/api/shopping-list/${itemId}`, { method: 'DELETE' })
    mutate()
  }

  async function clearAll() {
    await fetch('/api/shopping-list', { method: 'DELETE' })
    mutate()
    close()
  }

  async function handleShare() {
    if (sharing) return
    setSharing(true)
    try {
      const res = await fetch('/api/shopping-list/share', { method: 'POST' })
      if (!res.ok) return
      const { token, shareUrl: lanUrl } = await res.json()
      // Prefer the server-detected LAN IP so the link works from other devices.
      // Fall back to window.location.origin only if LAN IP detection failed.
      const url = lanUrl ?? `${window.location.origin}/list/${token}`
      setShareUrl(url)
    } finally {
      setSharing(false)
    }
  }

  async function copyToClipboard() {
    if (!shareUrl) return
    await navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <>
      {/* Floating action button */}
      <button
        onClick={() => setOpen(true)}
        aria-label="Shopping list"
        className="fixed bottom-6 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-primary shadow-lg active:scale-90 transition-transform duration-100"
      >
        <ShoppingCart className="h-6 w-6 text-primary-foreground" />
      </button>

      {/* Item count badge */}
      <ShoppingListBadge />

      {/* QR code full-screen modal */}
      {shareUrl && (
        <>
          <div
            className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm"
            onClick={() => {
              setShareUrl(null)
              setCopied(false)
            }}
            aria-hidden
          />
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-8 pointer-events-none">
            <div
              className="pointer-events-auto flex flex-col items-center gap-6 rounded-3xl bg-card p-10 shadow-2xl w-full max-w-sm"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-2xl font-bold text-foreground">Share List</h2>
              <QrCode url={shareUrl} size={260} />
              <p className="text-base text-muted-foreground">Scan to view · Expires in 24h</p>
              <button
                onClick={copyToClipboard}
                className="flex items-center gap-2 rounded-xl bg-primary px-6 py-4 text-lg font-semibold text-white active:scale-95 transition-transform w-full justify-center"
              >
                {copied ? <Check className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
                {copied ? 'Copied!' : 'Copy link'}
              </button>
              <button
                onClick={() => {
                  setShareUrl(null)
                  setCopied(false)
                }}
                className="text-base text-muted-foreground underline-offset-4 hover:underline py-2"
              >
                Close
              </button>
            </div>
          </div>
        </>
      )}

      {/* Backdrop + panel */}
      {open && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
            onClick={close}
            aria-hidden
          />
          <div
            data-testid="shopping-list-panel"
            className={`fixed bottom-0 left-0 right-0 z-50 flex max-h-[80vh] flex-col rounded-t-2xl bg-card shadow-2xl ${
              closing ? 'animate-panel-down' : 'animate-panel-up'
            }`}
          >
            <div className="flex justify-center pt-3 pb-1">
              <div className="h-1 w-10 rounded-full bg-border" />
            </div>

            <div className="flex items-center justify-between px-5 py-3">
              <div>
                <h2 className="text-lg font-bold text-foreground">Shopping List</h2>
                <p className="text-sm text-muted-foreground">
                  {items.length === 0
                    ? 'Nothing added yet'
                    : `${items.length} item${items.length !== 1 ? 's' : ''}`}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {items.length > 0 && (
                  <>
                    <button
                      onClick={handleShare}
                      disabled={sharing}
                      aria-label="Share list"
                      data-testid="share-list-btn"
                      className="flex items-center gap-2 rounded-xl px-4 py-3 text-base font-medium text-muted-foreground active:bg-muted transition-colors disabled:opacity-50"
                    >
                      <Share2 className="h-5 w-5" />
                      Share
                    </button>
                    <button
                      onClick={clearAll}
                      data-testid="clear-list-btn"
                      className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground active:bg-muted transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                      Clear all
                    </button>
                  </>
                )}
                <button
                  onClick={close}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-muted active:bg-muted/70 transition-colors"
                  aria-label="Close"
                >
                  <X className="h-5 w-5 text-foreground" />
                </button>
              </div>
            </div>

            <div className="overflow-y-auto px-4 pb-8">
              {items.length === 0 ? (
                <div className="flex flex-col items-center gap-3 py-12 text-muted-foreground">
                  <ShoppingCart className="h-10 w-10 opacity-30" />
                  <p className="text-base">Tap a product to add it</p>
                  <p className="text-sm opacity-70">Swipe left to remove items</p>
                </div>
              ) : (
                <ul className="flex flex-col divide-y divide-border">
                  {items.map((item) => (
                    <SwipeableItem key={item.id} item={item} onRemove={removeItem} />
                  ))}
                </ul>
              )}
            </div>
          </div>
        </>
      )}
    </>
  )
}

function ShoppingListBadge() {
  const { data } = useSWR<{ items: ShoppingListItemData[] }>('/api/shopping-list', fetcher, {
    refreshInterval: 10000,
  })
  const count = data?.items.length ?? 0
  if (count === 0) return null
  return (
    <div
      data-testid="shopping-list-badge"
      className="pointer-events-none fixed bottom-[62px] right-[14px] z-50 flex h-5 w-5 items-center justify-center rounded-full bg-green-500 text-[10px] font-bold text-white shadow"
    >
      {count > 99 ? '99+' : count}
    </div>
  )
}
