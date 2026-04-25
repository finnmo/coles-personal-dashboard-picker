'use client'

import { useState, useCallback } from 'react'
import type { EnrichedProduct } from '@/types/product'

export interface BulkIntervalEditHook {
  bulkMode: boolean
  toggleBulkMode: () => void
  pendingValues: Record<string, number>
  setPendingValue: (productId: string, days: number) => void
  saveAll: () => Promise<void>
  saving: boolean
  errors: Record<string, string>
  cancel: () => void
}

export function useBulkIntervalEdit(
  products: EnrichedProduct[],
  onUpdateInterval: (id: string, days: number) => Promise<void>
): BulkIntervalEditHook {
  const [bulkMode, setBulkMode] = useState(false)
  const [pendingValues, setPendingValues] = useState<Record<string, number>>({})
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const toggleBulkMode = useCallback(() => {
    setBulkMode((prev) => {
      if (!prev) {
        // Entering bulk mode: seed pending values from current products
        const initial: Record<string, number> = {}
        products.forEach((p) => {
          initial[p.id] = p.repurchaseIntervalDays
        })
        setPendingValues(initial)
        setErrors({})
      }
      return !prev
    })
  }, [products])

  const setPendingValue = useCallback((productId: string, days: number) => {
    setPendingValues((prev) => ({ ...prev, [productId]: days }))
  }, [])

  const saveAll = useCallback(async () => {
    setSaving(true)
    const newErrors: Record<string, string> = {}
    const changed = products.filter(
      (p) => pendingValues[p.id] !== undefined && pendingValues[p.id] !== p.repurchaseIntervalDays
    )

    await Promise.all(
      changed.map(async (p) => {
        try {
          await onUpdateInterval(p.id, pendingValues[p.id])
        } catch {
          newErrors[p.id] = 'Failed to save'
        }
      })
    )

    setErrors(newErrors)
    setSaving(false)
    if (Object.keys(newErrors).length === 0) {
      setBulkMode(false)
    }
  }, [products, pendingValues, onUpdateInterval])

  const cancel = useCallback(() => {
    setBulkMode(false)
    setPendingValues({})
    setErrors({})
  }, [])

  return {
    bulkMode,
    toggleBulkMode,
    pendingValues,
    setPendingValue,
    saveAll,
    saving,
    errors,
    cancel,
  }
}
