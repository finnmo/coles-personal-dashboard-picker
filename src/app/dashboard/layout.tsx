'use client'

import { Header } from '@/components/layout/Header'
import { ShoppingListSidebar } from '@/components/dashboard/ShoppingListSidebar'
import { IdleDimOverlay } from '@/components/dashboard/IdleDimOverlay'
import { useWakeLock } from '@/hooks/useWakeLock'

function DashboardShell({ children }: { children: React.ReactNode }) {
  useWakeLock()
  return (
    <div className="flex h-screen flex-col bg-background">
      <Header />
      <div className="flex min-h-0 flex-1 overflow-hidden">
        {/* Product grid — takes all remaining width */}
        <main className="min-h-0 flex-1 overflow-y-auto">{children}</main>
        {/* Shopping list — fixed 288px (w-72) right sidebar, always visible */}
        <ShoppingListSidebar />
      </div>
      <IdleDimOverlay />
    </div>
  )
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <DashboardShell>{children}</DashboardShell>
}
