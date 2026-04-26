'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { ThemeToggle } from './ThemeToggle'
import { AddProductDialog } from '@/components/dashboard/AddProductDialog'

export function Header() {
  const [dialogOpen, setDialogOpen] = useState(false)

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
        </div>
      </header>
      <AddProductDialog open={dialogOpen} onClose={() => setDialogOpen(false)} />
    </>
  )
}
