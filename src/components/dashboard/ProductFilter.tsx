'use client'

import { useMemo, useState } from 'react'
import type { EnrichedProduct } from '@/types/product'

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')

interface ProductFilterProps {
  products: EnrichedProduct[]
  children: (filtered: EnrichedProduct[]) => React.ReactNode
}

export function ProductFilter({ products, children }: ProductFilterProps) {
  const [activeLetter, setActiveLetter] = useState<string | null>(null)
  const [nameQuery, setNameQuery] = useState('')

  const availableLetters = useMemo(
    () => new Set(products.map((p) => p.name[0]?.toUpperCase()).filter(Boolean)),
    [products]
  )

  const filtered = useMemo(() => {
    let result = products
    if (activeLetter) {
      result = result.filter((p) => p.name[0]?.toUpperCase() === activeLetter)
    }
    if (nameQuery.trim()) {
      const q = nameQuery.trim().toLowerCase()
      result = result.filter((p) => p.name.toLowerCase().includes(q))
    }
    return result
  }, [products, activeLetter, nameQuery])

  const handleLetter = (letter: string) => {
    setActiveLetter((prev) => (prev === letter ? null : letter))
    setNameQuery('')
  }

  const handleQuery = (value: string) => {
    setNameQuery(value)
    if (value) setActiveLetter(null)
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Name search */}
      <div className="px-4 pt-3">
        <input
          type="search"
          placeholder="Filter by name…"
          value={nameQuery}
          onChange={(e) => handleQuery(e.target.value)}
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      {/* Letter picker */}
      <div className="flex flex-wrap gap-1 px-4">
        {LETTERS.map((letter) => {
          const available = availableLetters.has(letter)
          const active = activeLetter === letter
          return (
            <button
              key={letter}
              onClick={() => available && handleLetter(letter)}
              disabled={!available}
              aria-pressed={active}
              className={[
                'flex h-8 w-8 items-center justify-center rounded-md text-xs font-semibold transition-colors',
                active
                  ? 'bg-primary text-primary-foreground'
                  : available
                    ? 'bg-muted text-foreground hover:bg-muted/70'
                    : 'cursor-default text-muted-foreground/30',
              ].join(' ')}
            >
              {letter}
            </button>
          )
        })}
        {activeLetter && (
          <button
            onClick={() => setActiveLetter(null)}
            className="flex h-8 items-center rounded-md px-2 text-xs text-muted-foreground hover:text-foreground"
          >
            Clear
          </button>
        )}
      </div>

      {children(filtered)}
    </div>
  )
}
