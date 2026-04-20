'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { clsx } from 'clsx'
import { VALID_TABS } from '@/lib/constants'

const TAB_LABELS = { coles: 'Coles', iga: 'IGA' }

export function TabNav() {
  const pathname = usePathname()

  return (
    <nav className="flex gap-1 border-b border-border bg-card px-4" aria-label="Store tabs">
      {VALID_TABS.map((tab) => {
        const active = pathname.startsWith(`/dashboard/${tab}`)
        return (
          <Link
            key={tab}
            href={`/dashboard/${tab}`}
            data-testid={`tab-${tab}`}
            className={clsx(
              'relative -mb-px border-b-2 px-6 py-4 text-base font-semibold transition-colors',
              active
                ? tab === 'coles'
                  ? 'border-coles-red text-coles-red'
                  : 'border-iga-green text-iga-green'
                : 'border-transparent text-muted-foreground active:text-foreground'
            )}
            aria-current={active ? 'page' : undefined}
          >
            {TAB_LABELS[tab]}
          </Link>
        )
      })}
    </nav>
  )
}
