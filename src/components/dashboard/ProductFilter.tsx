'use client'

import { useMemo, useState } from 'react'
import type { EnrichedProduct } from '@/types/product'

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')

function wordFirstLetters(name: string): Set<string> {
  return new Set(
    name
      .split(/\s+/)
      .map((w) => w[0]?.toUpperCase())
      .filter(Boolean) as string[]
  )
}

interface ProductFilterProps {
  products: EnrichedProduct[]
  children: (filtered: EnrichedProduct[]) => React.ReactNode
}

export function ProductFilter({ products, children }: ProductFilterProps) {
  const [activeLetter, setActiveLetter] = useState<string | null>(null)
  const [nameQuery, setNameQuery] = useState('')

  const availableLetters = useMemo(() => {
    const set = new Set<string>()
    for (const p of products) {
      for (const letter of wordFirstLetters(p.name)) set.add(letter)
    }
    return set
  }, [products])

  const filtered = useMemo(() => {
    let result = products
    if (activeLetter) {
      result = result.filter((p) => wordFirstLetters(p.name).has(activeLetter))
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
    <div className="flex min-h-0 flex-1">
      {/* Left letter sidebar */}
      <div className="flex w-12 flex-col items-center gap-0.5 overflow-y-auto border-r border-border bg-card py-2">
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
                'flex h-9 w-9 items-center justify-center rounded-lg text-sm font-semibold transition-colors active:scale-90',
                active
                  ? 'bg-primary text-primary-foreground'
                  : available
                    ? 'text-foreground active:bg-muted'
                    : 'cursor-default text-muted-foreground/25',
              ].join(' ')}
            >
              {letter}
            </button>
          )
        })}
      </div>

      {/* Right content */}
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="px-3 pt-3 pb-2">
          <input
            type="search"
            placeholder="Filter by name…"
            value={nameQuery}
            onChange={(e) => handleQuery(e.target.value)}
            className="h-11 w-full rounded-xl border border-border bg-background px-4 text-base text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        {children(filtered)}
      </div>
    </div>
  )
}
