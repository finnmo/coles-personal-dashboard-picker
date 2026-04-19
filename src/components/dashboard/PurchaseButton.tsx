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
      const res = await fetch(`/api/list/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId }),
      })

      if (res.ok) {
        const data = await res.json()
        if (data.redirectUrl) {
          window.location.href = data.redirectUrl
        }
        setState('done')
        onSuccess?.()
        // Reset after 2s so the button is usable again
        setTimeout(() => setState('idle'), 2000)
      } else {
        setState('idle')
      }
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
        'flex h-10 w-10 items-center justify-center rounded-full transition-all duration-200',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
        state === 'done'
          ? 'bg-green-500 text-white'
          : 'bg-primary/10 text-primary hover:bg-primary hover:text-white active:scale-95',
        state === 'loading' && 'opacity-60'
      )}
    >
      {state === 'done' ? <Check className="h-5 w-5" /> : <ShoppingCart className="h-5 w-5" />}
    </button>
  )
}
