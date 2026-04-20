// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { computePriority } from '@/lib/priority'

const DAY_MS = 1000 * 60 * 60 * 24

function daysAgo(days: number, from: Date): Date {
  return new Date(from.getTime() - days * DAY_MS)
}

describe('computePriority — never purchased', () => {
  it('returns isNew=true when lastPurchasedAt is null', () => {
    const result = computePriority({ lastPurchasedAt: null, repurchaseIntervalDays: 14 })
    expect(result.isNew).toBe(true)
  })

  it('returns priorityScore=0 when never purchased', () => {
    const result = computePriority({ lastPurchasedAt: null, repurchaseIntervalDays: 14 })
    expect(result.priorityScore).toBe(0)
  })

  it('returns isOverdue=false when never purchased', () => {
    const result = computePriority({ lastPurchasedAt: null, repurchaseIntervalDays: 14 })
    expect(result.isOverdue).toBe(false)
  })

  it('returns daysSinceLastPurchase=null when never purchased', () => {
    const result = computePriority({ lastPurchasedAt: null, repurchaseIntervalDays: 14 })
    expect(result.daysSinceLastPurchase).toBeNull()
  })
})

describe('computePriority — purchased recently (not overdue)', () => {
  const now = new Date('2026-04-20T12:00:00Z')

  it('returns isNew=false when previously purchased', () => {
    const result = computePriority(
      { lastPurchasedAt: daysAgo(7, now), repurchaseIntervalDays: 14 },
      now
    )
    expect(result.isNew).toBe(false)
  })

  it('returns isOverdue=false when score < 1.0', () => {
    const result = computePriority(
      { lastPurchasedAt: daysAgo(7, now), repurchaseIntervalDays: 14 },
      now
    )
    expect(result.isOverdue).toBe(false)
  })

  it('calculates score as daysSince / interval', () => {
    const result = computePriority(
      { lastPurchasedAt: daysAgo(7, now), repurchaseIntervalDays: 14 },
      now
    )
    expect(result.priorityScore).toBe(0.5)
  })

  it('returns correct daysSinceLastPurchase (floored)', () => {
    const result = computePriority(
      { lastPurchasedAt: daysAgo(7, now), repurchaseIntervalDays: 14 },
      now
    )
    expect(result.daysSinceLastPurchase).toBe(7)
  })

  it('floors partial days in daysSinceLastPurchase', () => {
    const partialDaysAgo = new Date(now.getTime() - 6.5 * DAY_MS)
    const result = computePriority(
      { lastPurchasedAt: partialDaysAgo, repurchaseIntervalDays: 14 },
      now
    )
    expect(result.daysSinceLastPurchase).toBe(6)
  })

  it('score is 0 when purchased exactly now', () => {
    const result = computePriority({ lastPurchasedAt: now, repurchaseIntervalDays: 14 }, now)
    expect(result.priorityScore).toBe(0)
    expect(result.isOverdue).toBe(false)
  })
})

describe('computePriority — overdue (score >= 1.0)', () => {
  const now = new Date('2026-04-20T12:00:00Z')

  it('isOverdue=true when score equals exactly 1.0', () => {
    const result = computePriority(
      { lastPurchasedAt: daysAgo(14, now), repurchaseIntervalDays: 14 },
      now
    )
    expect(result.isOverdue).toBe(true)
    expect(result.priorityScore).toBe(1)
  })

  it('isOverdue=true when score exceeds 1.0', () => {
    const result = computePriority(
      { lastPurchasedAt: daysAgo(21, now), repurchaseIntervalDays: 14 },
      now
    )
    expect(result.isOverdue).toBe(true)
    expect(result.priorityScore).toBe(1.5)
  })

  it('isNew=false even when overdue', () => {
    const result = computePriority(
      { lastPurchasedAt: daysAgo(30, now), repurchaseIntervalDays: 14 },
      now
    )
    expect(result.isNew).toBe(false)
  })

  it('computes high score correctly for very old purchase', () => {
    // 90 days ago / 30-day interval → score = 3.0
    const result = computePriority(
      { lastPurchasedAt: daysAgo(90, now), repurchaseIntervalDays: 30 },
      now
    )
    expect(result.priorityScore).toBe(3)
    expect(result.isOverdue).toBe(true)
    expect(result.daysSinceLastPurchase).toBe(90)
  })
})

describe('computePriority — score rounding', () => {
  const now = new Date('2026-04-20T12:00:00Z')

  it('rounds score to 3 decimal places', () => {
    // 1 day / 3-day interval → 1/3 = 0.3333... → 0.333
    const result = computePriority(
      { lastPurchasedAt: daysAgo(1, now), repurchaseIntervalDays: 3 },
      now
    )
    expect(result.priorityScore).toBe(0.333)
  })

  it('handles interval of 1 day', () => {
    const result = computePriority(
      { lastPurchasedAt: daysAgo(1, now), repurchaseIntervalDays: 1 },
      now
    )
    expect(result.priorityScore).toBe(1)
    expect(result.isOverdue).toBe(true)
  })

  it('handles long interval of 365 days', () => {
    const result = computePriority(
      { lastPurchasedAt: daysAgo(180, now), repurchaseIntervalDays: 365 },
      now
    )
    expect(result.isOverdue).toBe(false)
    expect(result.daysSinceLastPurchase).toBe(180)
  })
})

describe('computePriority — default now parameter', () => {
  it('uses current time when now is not provided', () => {
    const justNow = new Date()
    const lastPurchasedAt = new Date(justNow.getTime() - 14 * DAY_MS)
    const result = computePriority({ lastPurchasedAt, repurchaseIntervalDays: 14 })
    expect(result.priorityScore).toBeGreaterThanOrEqual(1)
    expect(result.isNew).toBe(false)
  })
})

describe('computePriority — sorting invariants', () => {
  const now = new Date('2026-04-20T12:00:00Z')

  it('overdue item has higher score than in-progress item', () => {
    const overdue = computePriority(
      { lastPurchasedAt: daysAgo(21, now), repurchaseIntervalDays: 14 },
      now
    )
    const inProgress = computePriority(
      { lastPurchasedAt: daysAgo(7, now), repurchaseIntervalDays: 14 },
      now
    )
    expect(overdue.priorityScore).toBeGreaterThan(inProgress.priorityScore)
  })

  it('longer overdue has higher score than shorter overdue', () => {
    const veryOverdue = computePriority(
      { lastPurchasedAt: daysAgo(30, now), repurchaseIntervalDays: 14 },
      now
    )
    const slightlyOverdue = computePriority(
      { lastPurchasedAt: daysAgo(15, now), repurchaseIntervalDays: 14 },
      now
    )
    expect(veryOverdue.priorityScore).toBeGreaterThan(slightlyOverdue.priorityScore)
  })

  it('new item score is 0 — always lowest', () => {
    const newItem = computePriority({ lastPurchasedAt: null, repurchaseIntervalDays: 14 }, now)
    const inProgress = computePriority(
      { lastPurchasedAt: daysAgo(1, now), repurchaseIntervalDays: 14 },
      now
    )
    expect(newItem.priorityScore).toBe(0)
    expect(inProgress.priorityScore).toBeGreaterThan(newItem.priorityScore)
  })
})
