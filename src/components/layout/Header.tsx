'use client'

import { useRouter } from 'next/navigation'
import { LogOut } from 'lucide-react'
import { ThemeToggle } from './ThemeToggle'
import { Button } from '@/components/ui/button'

export function Header() {
  const router = useRouter()

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
    router.refresh()
  }

  return (
    <header className="flex h-14 items-center justify-between border-b border-border bg-card px-4">
      <h1 className="text-base font-semibold text-foreground">Household Dashboard</h1>
      <div className="flex items-center gap-1">
        <ThemeToggle />
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLogout}
          aria-label="Sign out"
          data-testid="logout-button"
        >
          <LogOut className="h-5 w-5" />
        </Button>
      </div>
    </header>
  )
}
