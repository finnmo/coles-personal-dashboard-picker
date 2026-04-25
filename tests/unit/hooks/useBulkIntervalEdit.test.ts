import { describe, it, expect, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useBulkIntervalEdit } from '@/hooks/useBulkIntervalEdit'
import type { EnrichedProduct } from '@/types/product'

function makeProduct(id: string, interval: number): EnrichedProduct {
  return {
    id,
    name: `Product ${id}`,
    imageUrl: null,
    offProductId: null,
    repurchaseIntervalDays: interval,
    lastPurchasedAt: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    priorityScore: 0,
    isNew: true,
    isOverdue: false,
    daysSinceLastPurchase: null,
  }
}

describe('useBulkIntervalEdit', () => {
  it('initialises pending values from products when entering bulk mode', () => {
    const products = [makeProduct('p1', 7), makeProduct('p2', 14)]
    const { result } = renderHook(() => useBulkIntervalEdit(products, vi.fn()))
    expect(result.current.bulkMode).toBe(false)

    act(() => result.current.toggleBulkMode())

    expect(result.current.bulkMode).toBe(true)
    expect(result.current.pendingValues).toEqual({ p1: 7, p2: 14 })
  })

  it('only saves changed values', async () => {
    const onUpdate = vi.fn().mockResolvedValue(undefined)
    const products = [makeProduct('p1', 7), makeProduct('p2', 14)]
    const { result } = renderHook(() => useBulkIntervalEdit(products, onUpdate))

    act(() => result.current.toggleBulkMode())
    act(() => result.current.setPendingValue('p2', 21))

    await act(() => result.current.saveAll())

    expect(onUpdate).toHaveBeenCalledTimes(1)
    expect(onUpdate).toHaveBeenCalledWith('p2', 21)
  })

  it('records per-item errors without aborting others', async () => {
    const onUpdate = vi
      .fn()
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(new Error('save failed'))
    const products = [makeProduct('p1', 7), makeProduct('p2', 14)]
    const { result } = renderHook(() => useBulkIntervalEdit(products, onUpdate))

    act(() => result.current.toggleBulkMode())
    act(() => {
      result.current.setPendingValue('p1', 10)
      result.current.setPendingValue('p2', 21)
    })

    await act(() => result.current.saveAll())

    expect(onUpdate).toHaveBeenCalledTimes(2)
    expect(Object.keys(result.current.errors)).toHaveLength(1)
  })

  it('saving is false after saveAll resolves', async () => {
    const onUpdate = vi.fn().mockResolvedValue(undefined)
    const products = [makeProduct('p1', 7)]
    const { result } = renderHook(() => useBulkIntervalEdit(products, onUpdate))

    act(() => result.current.toggleBulkMode())
    act(() => result.current.setPendingValue('p1', 21))

    await act(() => result.current.saveAll())

    expect(result.current.saving).toBe(false)
  })

  it('cancel resets pending values and exits bulk mode', async () => {
    const products = [makeProduct('p1', 7)]
    const { result } = renderHook(() => useBulkIntervalEdit(products, vi.fn()))

    await act(async () => {
      result.current.toggleBulkMode()
    })
    await act(async () => {
      result.current.setPendingValue('p1', 99)
    })
    await act(async () => {
      result.current.cancel()
    })

    expect(result.current.bulkMode).toBe(false)
    expect(result.current.pendingValues).toEqual({})
  })
})
