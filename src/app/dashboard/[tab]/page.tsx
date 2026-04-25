import { notFound } from 'next/navigation'
import { ProductGridWithBoundary } from '@/components/dashboard/ProductGridWithBoundary'
import { VALID_TABS, TAB_TO_STORE } from '@/lib/constants'
import type { TabSlug } from '@/lib/constants'

interface PageProps {
  params: { tab: string }
}

export function generateStaticParams() {
  return VALID_TABS.map((tab) => ({ tab }))
}

export default function TabPage({ params }: PageProps) {
  const tab = params.tab as TabSlug
  if (!VALID_TABS.includes(tab)) notFound()

  const store = TAB_TO_STORE[tab]
  return <ProductGridWithBoundary store={store as 'COLES' | 'IGA'} />
}
