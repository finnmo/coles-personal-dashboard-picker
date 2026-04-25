'use client'

import { useState } from 'react'
import { Check, Pencil } from 'lucide-react'

interface IntervalEditorProps {
  productId: string
  currentInterval: number
  onSave: (productId: string, days: number) => Promise<void>
  bulkMode?: boolean
  bulkValue?: number
  onBulkChange?: (days: number) => void
}

export function IntervalEditor({
  productId,
  currentInterval,
  onSave,
  bulkMode,
  bulkValue,
  onBulkChange,
}: IntervalEditorProps) {
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(String(currentInterval))
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    const days = parseInt(value, 10)
    if (!days || days < 1) return
    setSaving(true)
    await onSave(productId, days)
    setSaving(false)
    setEditing(false)
  }

  if (bulkMode) {
    return (
      <div className="flex items-center gap-1">
        <input
          type="number"
          min="1"
          max="365"
          value={bulkValue ?? currentInterval}
          onChange={(e) => onBulkChange?.(parseInt(e.target.value, 10) || currentInterval)}
          className="h-7 w-16 rounded border border-input bg-card px-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
          data-testid={`interval-bulk-${productId}`}
        />
        <span className="text-xs text-muted-foreground">days</span>
      </div>
    )
  }

  if (!editing) {
    return (
      <button
        onClick={() => setEditing(true)}
        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        data-testid={`interval-edit-${productId}`}
        aria-label={`Edit repurchase interval (currently ${currentInterval} days)`}
      >
        <span>Every {currentInterval}d</span>
        <Pencil className="h-3 w-3" />
      </button>
    )
  }

  return (
    <div className="flex items-center gap-1">
      <input
        type="number"
        min="1"
        max="365"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="h-7 w-16 rounded border border-input bg-card px-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
        data-testid={`interval-input-${productId}`}
        autoFocus
        onKeyDown={(e) => e.key === 'Enter' && handleSave()}
      />
      <span className="text-xs text-muted-foreground">days</span>
      <button
        onClick={handleSave}
        disabled={saving}
        className="flex h-7 w-7 items-center justify-center rounded bg-primary text-white disabled:opacity-50"
        data-testid={`interval-save-${productId}`}
      >
        <Check className="h-3 w-3" />
      </button>
    </div>
  )
}
