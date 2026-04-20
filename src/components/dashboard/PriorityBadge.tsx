import { Badge } from '@/components/ui/badge'
import type { EnrichedProduct } from '@/types/product'

type Props = Pick<
  EnrichedProduct,
  'isNew' | 'isOverdue' | 'priorityScore' | 'daysSinceLastPurchase'
>

export function PriorityBadge({ isNew, isOverdue, priorityScore, daysSinceLastPurchase }: Props) {
  if (isNew) {
    return (
      <Badge variant="new" data-testid="priority-badge">
        New
      </Badge>
    )
  }
  if (isOverdue) {
    return (
      <Badge variant="overdue" data-testid="priority-badge">
        Overdue
      </Badge>
    )
  }
  const pct = Math.round(priorityScore * 100)
  return (
    <Badge
      variant="default"
      data-testid="priority-badge"
      aria-label={`${daysSinceLastPurchase} days since last purchase`}
    >
      {pct}%
    </Badge>
  )
}
