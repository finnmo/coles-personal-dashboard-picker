'use client'

import { useState, useCallback } from 'react'
import Image from 'next/image'
import { Check } from 'lucide-react'
import { PriorityBadge } from './PriorityBadge'
import type { EnrichedProduct } from '@/types/product'

interface ProductTileProps {
  product: EnrichedProduct
  onPurchased?: () => void
}

export function ProductTile({ product, onPurchased }: ProductTileProps) {
  const [state, setState] = useState<'idle' | 'confirming'>('idle')

  const handleTap = useCallback(async () => {
    if (state !== 'idle') return
    setState('confirming')

    try {
      const [, listRes] = await Promise.all([
        fetch(`/api/products/${product.id}/purchase`, { method: 'POST' }),
        fetch('/api/list/add', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ productId: product.id }),
        }),
      ])

      if (listRes.ok) {
        const data = await listRes.json().catch(() => null)
        if (data?.redirectUrl) window.location.href = data.redirectUrl
      }

      onPurchased?.()
    } catch {
      // silent — the animation still completes
    }

    setTimeout(() => setState('idle'), 1400)
  }, [state, product.id, onPurchased])

  return (
    <article
      role="button"
      tabIndex={0}
      onClick={handleTap}
      onKeyDown={(e) => e.key === 'Enter' && handleTap()}
      className="group relative flex cursor-pointer flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm active:scale-[0.97] active:shadow-none transition-transform duration-100 select-none"
      data-testid={`product-tile-${product.id}`}
    >
      {/* Product image */}
      <div className="relative aspect-square w-full overflow-hidden bg-muted">
        {product.imageUrl ? (
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
            className="object-contain p-2"
            draggable={false}
          />
        ) : (
          <div className="flex h-full items-center justify-center text-3xl text-muted-foreground">
            🛒
          </div>
        )}
        <div className="absolute left-2 top-2">
          <PriorityBadge
            isNew={product.isNew}
            isOverdue={product.isOverdue}
            priorityScore={product.priorityScore}
            daysSinceLastPurchase={product.daysSinceLastPurchase}
          />
        </div>
      </div>

      {/* Product name + last bought */}
      <div className="p-3 pt-2">
        <p className="line-clamp-2 text-sm font-semibold leading-snug text-foreground">
          {product.name}
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {product.isNew
            ? 'Never bought'
            : product.daysSinceLastPurchase === 0
              ? 'Bought today'
              : product.daysSinceLastPurchase === 1
                ? 'Bought yesterday'
                : `${product.daysSinceLastPurchase}d ago`}
        </p>
      </div>

      {/* Confirmation overlay */}
      {state === 'confirming' && (
        <div className="animate-tile-overlay pointer-events-none absolute inset-0 flex items-center justify-center rounded-xl bg-black/40">
          <div className="animate-tile-circle flex h-16 w-16 items-center justify-center rounded-full bg-green-500 shadow-lg">
            <Check className="h-9 w-9 stroke-[3] text-white" />
          </div>
        </div>
      )}
    </article>
  )
}
