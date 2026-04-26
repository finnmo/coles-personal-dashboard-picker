'use client'

import { useState, useEffect, type FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const ERROR_MESSAGES: Record<string, string> = {
  invalid: 'Incorrect password — please try again',
  too_many_attempts: 'Too many attempts — wait 15 minutes and try again',
  server: 'Server error — contact the administrator',
  invalid_request: 'Invalid request — please try again',
}

export default function LoginPage() {
  const [loading, setLoading] = useState(false)
  const [urlError, setUrlError] = useState('')

  // Read any error code set by the server-side redirect on failed login.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const code = params.get('error')
    if (code) setUrlError(ERROR_MESSAGES[code] ?? 'Login failed — please try again')
  }, [])

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    // Do not preventDefault — the native form POST must go through so the
    // browser receives the session cookie in a navigation response.
    // iOS Safari only persists cookies from navigation responses, not fetch().
    setLoading(true)
    // If the form submission errors at the network level, the browser will
    // display its own error. Clear loading state just in case JS is still alive.
    setTimeout(() => setLoading(false), 10_000)
    void e // suppress unused-variable lint
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-foreground">Household Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">Enter your password to continue</p>
        </div>

        {/*
          Native form POST → /api/auth/login-redirect
          The server validates, sets the session cookie in the 303 redirect
          response, and redirects to /dashboard. This guarantees the cookie
          lands in the browser's persistent store on all Safari versions.
        */}
        <form
          method="POST"
          action="/api/auth/login-redirect"
          onSubmit={handleSubmit}
          className="space-y-4"
        >
          <Input
            type="password"
            name="password"
            placeholder="Password"
            error={urlError}
            autoFocus
            autoComplete="current-password"
            aria-label="Password"
            data-testid="password-input"
          />

          <Button
            type="submit"
            size="lg"
            loading={loading}
            className="w-full"
            data-testid="login-button"
          >
            Sign in
          </Button>
        </form>
      </div>
    </div>
  )
}
