'use client'

import { useState } from 'react'
import { ShoppingCart, Check } from 'lucide-react'
import { clsx } from 'clsx'

interface PurchaseButtonProps {
  productId: string
  onSuccess?: () => void
}

export function PurchaseButton({ productId, onSuccess }: PurchaseButtonProps) {
  const [state, setState] = useState<'idle' | 'loading' | 'done'>('idle')

  async function handleClick() {
    if (state !== 'idle') return
    setState('loading')

    try {
      // Mark as purchased in DB
      const purchaseRes = await fetch(`/api/products/${productId}/purchase`, {
        method: 'POST',
      })
      if (!purchaseRes.ok) {
        setState('idle')
        return
      }

      // Add to household list (Apple Reminders or Google Tasks)
      const listRes = await fetch('/api/list/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId }),
      })

      if (listRes.ok) {
        const data = await listRes.json()
        // Apple Reminders: open the Shortcuts URL on the device
        if (data.redirectUrl) {
          window.location.href = data.redirectUrl
        }
      }

      setState('done')
      onSuccess?.()
      setTimeout(() => setState('idle'), 2000)
    } catch {
      setState('idle')
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={state === 'loading'}
      data-testid={`purchase-btn-${productId}`}
      aria-label="Add to shopping list"
      className={clsx(
        'flex h-12 w-12 items-center justify-center rounded-full transition-all duration-150',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
        state === 'done'
          ? 'bg-green-500 text-white'
          : 'bg-primary/10 text-primary active:bg-primary active:text-white active:scale-90',
        state === 'loading' && 'opacity-50'
      )}
    >
      {state === 'done' ? <Check className="h-6 w-6" /> : <ShoppingCart className="h-6 w-6" />}
    </button>
  )
}
