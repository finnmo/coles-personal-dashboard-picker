import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { PriorityBadge } from '@/components/dashboard/PriorityBadge'

describe('PriorityBadge', () => {
  it('renders "New" badge when isNew is true', () => {
    render(
      <PriorityBadge
        isNew={true}
        isOverdue={false}
        priorityScore={0}
        daysSinceLastPurchase={null}
      />
    )
    expect(screen.getByText('New')).toBeInTheDocument()
  })

  it('renders "Overdue" badge when isOverdue is true', () => {
    render(
      <PriorityBadge
        isNew={false}
        isOverdue={true}
        priorityScore={1.2}
        daysSinceLastPurchase={12}
      />
    )
    expect(screen.getByText('Overdue')).toBeInTheDocument()
  })

  it('renders percentage when score is between 0 and 1', () => {
    render(
      <PriorityBadge
        isNew={false}
        isOverdue={false}
        priorityScore={0.5}
        daysSinceLastPurchase={7}
      />
    )
    expect(screen.getByText('50%')).toBeInTheDocument()
  })

  it('rounds percentage to nearest integer', () => {
    render(
      <PriorityBadge
        isNew={false}
        isOverdue={false}
        priorityScore={0.333}
        daysSinceLastPurchase={3}
      />
    )
    expect(screen.getByText('33%')).toBeInTheDocument()
  })

  it('isNew takes priority over isOverdue=false', () => {
    render(
      <PriorityBadge
        isNew={true}
        isOverdue={false}
        priorityScore={0}
        daysSinceLastPurchase={null}
      />
    )
    expect(screen.queryByText('Overdue')).not.toBeInTheDocument()
    expect(screen.getByText('New')).toBeInTheDocument()
  })
})
