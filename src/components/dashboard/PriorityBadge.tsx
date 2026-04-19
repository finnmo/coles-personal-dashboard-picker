import { Badge } from '@/components/ui/badge'
import type { EnrichedProduct } from '@/types/product'

type Props = Pick<
  EnrichedProduct,
  'isNew' | 'isOverdue' | 'priorityScore' | 'daysSinceLastPurchase'
>

export function PriorityBadge({ isNew, isOverdue, priorityScore, daysSinceLastPurchase }: Props) {
  if (isNew) {
    return <Badge variant="new">New</Badge>
  }
  if (isOverdue) {
    return <Badge variant="overdue">Overdue</Badge>
  }
  const pct = Math.round(priorityScore * 100)
  return (
    <Badge variant="default" aria-label={`${daysSinceLastPurchase} days since last purchase`}>
      {pct}%
    </Badge>
  )
}
