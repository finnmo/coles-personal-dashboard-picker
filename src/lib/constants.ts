export const STORES = {
  COLES: 'COLES',
  IGA: 'IGA',
} as const

export const STORE_LABELS: Record<string, string> = {
  COLES: 'Coles',
  IGA: 'IGA',
}

export const VALID_TABS = ['coles', 'iga'] as const
export type TabSlug = (typeof VALID_TABS)[number]

export const TAB_TO_STORE: Record<TabSlug, string> = {
  coles: 'COLES',
  iga: 'IGA',
}
