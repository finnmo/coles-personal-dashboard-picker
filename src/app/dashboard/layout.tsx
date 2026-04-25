'use client'

import { Header } from '@/components/layout/Header'
import { ShoppingListPanel } from '@/components/dashboard/ShoppingListPanel'
import { IdleDimOverlay } from '@/components/dashboard/IdleDimOverlay'
import { useWakeLock } from '@/hooks/useWakeLock'

function DashboardShell({ children }: { children: React.ReactNode }) {
  useWakeLock()
  return (
    <div className="flex h-screen flex-col bg-background">
      <Header />
      <main className="flex min-h-0 flex-1 overflow-hidden">{children}</main>
      <ShoppingListPanel />
      <IdleDimOverlay />
    </div>
  )
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <DashboardShell>{children}</DashboardShell>
}
