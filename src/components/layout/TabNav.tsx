'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { clsx } from 'clsx'
import { VALID_TABS } from '@/lib/constants'
import { useOverdueCounts } from '@/hooks/useOverdueCounts'
import type { Store } from '@/types/product'

const TAB_LABELS: Record<string, string> = { coles: 'Coles', iga: 'IGA' }
const TAB_STORE: Record<string, Store> = { coles: 'COLES', iga: 'IGA' }

export function TabNav() {
  const pathname = usePathname()
  const overdue = useOverdueCounts()

  return (
    <nav className="flex gap-1 border-b border-border bg-card px-4" aria-label="Store tabs">
      {VALID_TABS.map((tab) => {
        const active = pathname.startsWith(`/dashboard/${tab}`)
        const overdueCount = overdue[TAB_STORE[tab]]
        return (
          <Link
            key={tab}
            href={`/dashboard/${tab}`}
            data-testid={`tab-${tab}`}
            className={clsx(
              'relative -mb-px flex items-center gap-2 border-b-2 px-6 py-4 text-base font-semibold transition-colors',
              active
                ? tab === 'coles'
                  ? 'border-coles-red text-coles-red'
                  : 'border-iga-green text-iga-green'
                : 'border-transparent text-muted-foreground active:text-foreground'
            )}
            aria-current={active ? 'page' : undefined}
          >
            {TAB_LABELS[tab]}
            {overdueCount > 0 && (
              <span
                data-testid={`tab-${tab}-overdue-badge`}
                className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[11px] font-bold leading-none text-white"
              >
                {overdueCount}
              </span>
            )}
          </Link>
        )
      })}
    </nav>
  )
}
