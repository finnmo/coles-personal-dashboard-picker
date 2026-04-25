'use client'

import { useState, useEffect, useRef } from 'react'
import type { StoreSearchResult } from '@/lib/store-search'

type SearchState = {
  results: StoreSearchResult[]
  isLoading: boolean
  error: string | null
}

export function useSearch() {
  const [query, setQuery] = useState('')
  const [state, setState] = useState<SearchState>({ results: [], isLoading: false, error: null })
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)

    if (!query.trim()) {
      setState({ results: [], isLoading: false, error: null })
      return
    }

    setState((s) => ({ ...s, isLoading: true, error: null }))

    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`)
        const data = await res.json()
        if (!res.ok) {
          setState({ results: [], isLoading: false, error: data.error ?? 'Search failed' })
        } else {
          setState({ results: data.results ?? [], isLoading: false, error: null })
        }
      } catch {
        setState({ results: [], isLoading: false, error: 'Network error' })
      }
    }, 400)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [query])

  return { query, setQuery, ...state }
}
