import { NextResponse } from 'next/server'
import type { EnrichedProduct } from '@/types/product'

// Temporary mock data — replaced with real DB queries in feat/admin-panel
const MOCK_PRODUCTS: EnrichedProduct[] = [
  {
    id: 'mock-1',
    name: 'Full Cream Milk 2L',
    imageUrl: null,
    store: 'COLES',
    colesProductId: null,
    igaProductId: null,
    repurchaseIntervalDays: 7,
    lastPurchasedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    priorityScore: 1.14,
    isOverdue: true,
    isNew: false,
    daysSinceLastPurchase: 8,
  },
  {
    id: 'mock-2',
    name: 'White Sandwich Bread',
    imageUrl: null,
    store: 'COLES',
    colesProductId: null,
    igaProductId: null,
    repurchaseIntervalDays: 7,
    lastPurchasedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    priorityScore: 0.71,
    isOverdue: false,
    isNew: false,
    daysSinceLastPurchase: 5,
  },
  {
    id: 'mock-3',
    name: 'Free Range Eggs 12pk',
    imageUrl: null,
    store: 'COLES',
    colesProductId: null,
    igaProductId: null,
    repurchaseIntervalDays: 14,
    lastPurchasedAt: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    priorityScore: 0,
    isOverdue: false,
    isNew: true,
    daysSinceLastPurchase: null,
  },
  {
    id: 'mock-4',
    name: 'Greek Yoghurt 500g',
    imageUrl: null,
    store: 'IGA',
    colesProductId: null,
    igaProductId: null,
    repurchaseIntervalDays: 10,
    lastPurchasedAt: new Date(Date.now() - 11 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    priorityScore: 1.1,
    isOverdue: true,
    isNew: false,
    daysSinceLastPurchase: 11,
  },
  {
    id: 'mock-5',
    name: 'Pasta 500g',
    imageUrl: null,
    store: 'IGA',
    colesProductId: null,
    igaProductId: null,
    repurchaseIntervalDays: 30,
    lastPurchasedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    priorityScore: 0.33,
    isOverdue: false,
    isNew: false,
    daysSinceLastPurchase: 10,
  },
]

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const store = searchParams.get('store')?.toUpperCase()

  const products = store ? MOCK_PRODUCTS.filter((p) => p.store === store) : MOCK_PRODUCTS

  const sorted = [...products].sort((a, b) => {
    if (a.isNew && !b.isNew) return 1
    if (!a.isNew && b.isNew) return -1
    return b.priorityScore - a.priorityScore
  })

  return NextResponse.json({ products: sorted })
}
