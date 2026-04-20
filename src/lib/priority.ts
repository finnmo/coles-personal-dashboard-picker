export type PriorityInput = {
  lastPurchasedAt: Date | null
  repurchaseIntervalDays: number
}

export type PriorityResult = {
  priorityScore: number
  isOverdue: boolean
  isNew: boolean
  daysSinceLastPurchase: number | null
}

export function computePriority(input: PriorityInput, now: Date = new Date()): PriorityResult {
  const { lastPurchasedAt, repurchaseIntervalDays } = input

  if (!lastPurchasedAt) {
    return { priorityScore: 0, isOverdue: false, isNew: true, daysSinceLastPurchase: null }
  }

  const msPerDay = 1000 * 60 * 60 * 24
  const daysSince = (now.getTime() - lastPurchasedAt.getTime()) / msPerDay
  const score = daysSince / repurchaseIntervalDays

  return {
    priorityScore: Math.round(score * 1000) / 1000,
    isOverdue: score >= 1.0,
    isNew: false,
    daysSinceLastPurchase: Math.floor(daysSince),
  }
}
