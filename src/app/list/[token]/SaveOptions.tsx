'use client'

import { useState } from 'react'
import { Share2, MessageSquare, Mail, Copy, Check } from 'lucide-react'

interface Props {
  itemNames: string[]
}

export function SaveOptions({ itemNames }: Props) {
  const [copied, setCopied] = useState(false)

  const listText = ['Shopping List', ...itemNames.map((n) => `• ${n}`)].join('\n')
  const encodedText = encodeURIComponent(listText)
  const canShare = typeof navigator !== 'undefined' && 'share' in navigator

  async function shareNative() {
    try {
      await navigator.share({ title: 'Shopping List', text: listText })
    } catch {
      // User cancelled or API not supported — no action needed.
    }
  }

  async function copyList() {
    await navigator.clipboard.writeText(listText)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  return (
    <div className="flex flex-col space-y-3">
      {canShare && (
        <button
          onClick={shareNative}
          className="flex items-center space-x-3 rounded-2xl bg-primary px-5 py-4 text-base font-semibold text-primary-foreground active:scale-95 transition-transform w-full"
        >
          <Share2 className="h-5 w-5 shrink-0" />
          <span className="text-left leading-tight">Save to Reminders, Notes or Messages</span>
        </button>
      )}

      <a
        href={`sms:?body=${encodedText}`}
        className="flex items-center space-x-3 rounded-2xl border border-border bg-card px-5 py-4 text-base font-medium text-foreground active:bg-muted transition-colors w-full"
      >
        <MessageSquare className="h-5 w-5 shrink-0 text-muted-foreground" />
        Send as SMS
      </a>

      <a
        href={`mailto:?subject=Shopping+List&body=${encodedText}`}
        className="flex items-center space-x-3 rounded-2xl border border-border bg-card px-5 py-4 text-base font-medium text-foreground active:bg-muted transition-colors w-full"
      >
        <Mail className="h-5 w-5 shrink-0 text-muted-foreground" />
        Send as Email
      </a>

      <button
        onClick={copyList}
        className="flex items-center space-x-3 rounded-2xl border border-border bg-card px-5 py-4 text-base font-medium text-foreground active:bg-muted transition-colors w-full"
      >
        {copied ? (
          <Check className="h-5 w-5 shrink-0 text-green-500" />
        ) : (
          <Copy className="h-5 w-5 shrink-0 text-muted-foreground" />
        )}
        {copied ? 'Copied!' : 'Copy to clipboard'}
      </button>
    </div>
  )
}
