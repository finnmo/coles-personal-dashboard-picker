'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { LogOut, Plus } from 'lucide-react'
import { ThemeToggle } from './ThemeToggle'
import { Button } from '@/components/ui/button'
import { AddProductDialog } from '@/components/dashboard/AddProductDialog'

export function Header() {
  const router = useRouter()
  const [dialogOpen, setDialogOpen] = useState(false)

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
    router.refresh()
  }

  return (
    <>
      <header className="flex h-14 items-center justify-between border-b border-border bg-card px-4">
        <h1 className="text-lg font-bold tracking-tight text-foreground">Household Dashboard</h1>
        <div className="flex items-center space-x-1">
          <button
            onClick={() => setDialogOpen(true)}
            aria-label="Add product"
            className="flex h-11 items-center space-x-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground active:opacity-80 transition-opacity"
          >
            <Plus className="h-4 w-4" />
            Add
          </button>
          <ThemeToggle />
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            aria-label="Sign out"
            data-testid="logout-button"
            className="h-11 w-11"
          >
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </header>
      <AddProductDialog open={dialogOpen} onClose={() => setDialogOpen(false)} />
    </>
  )
}
