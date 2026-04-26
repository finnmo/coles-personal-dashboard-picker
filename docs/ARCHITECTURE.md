# Architecture

## Overview

```
┌──────────────────────────────────────────────────────┐
│  iPad (Wall Display) — http://vixenstower.local:3000  │
│  ┌────────────────────────────┬───────────────────┐  │
│  │   Product Grid (70%)       │  Shopping List     │  │
│  │   Tap tile → purchased     │  Sidebar (30%)     │  │
│  │   + added to list          │  Always visible    │  │
│  ├────────────────────────────┴───────────────────┤  │
│  │   Header: Add (dialog) · Theme toggle           │  │
│  └────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────┘
         │ local LAN (no internet required for dashboard)
┌────────▼─────────────────────────────────────────────┐
│  Next.js 14 App Router (Docker container)            │
│  /api/products   /api/search   /api/shopping-list    │
│  /api/list/add   /api/shopping-list/share            │
│        │                │               │            │
│   SQLite DB       store-search.ts   Google Tasks API │
│   (Prisma)      (concurrent fetch)  (OAuth2 refresh) │
│                  /      |      \                     │
│            Coles   Woolworths   IGA                  │
│           RapidAPI  RapidAPI   scrape                │
└──────────────────────────────────────────────────────┘
         │
┌────────▼─────────────────────────────────────────────┐
│  Mobile devices (anywhere, via Google Tasks app)     │
│  iOS / Android — native Google Tasks                 │
│  Check off items → dashboard syncs within 30 seconds │
└──────────────────────────────────────────────────────┘
```

## Tech Rationale

- **Next.js 14 App Router**: Single process handles both SSR and API routes — no separate backend needed. Ideal for a Docker container.
- **SQLite + Prisma**: Zero-infrastructure database for a single-household app. Prisma provides type-safe queries and migration management.
- **Tailwind CSS**: Utility-first with built-in dark mode support via `class` strategy.
- **SWR**: Client-side data fetching with automatic revalidation and 30-second polling for the shopping list sidebar.
- **No authentication**: The app is LAN-only (Docker container, not exposed to the internet). Auth was removed to fix iOS 12 compatibility issues and because it added no real security benefit.

## Priority Algorithm

Products are sorted by urgency score:

```
score = daysSinceLastPurchase / repurchaseIntervalDays
```

| Score                  | State    | Badge              |
| ---------------------- | -------- | ------------------ |
| null (never purchased) | New      | Blue "New"         |
| 0.0 – 0.99             | On track | Neutral, showing % |
| >= 1.0                 | Overdue  | Red "Overdue"      |

Products sort descending by score. "New" products (score = 0, isNew = true) sort to the bottom.

The algorithm lives in `src/lib/priority.ts` as a pure function to enable exhaustive unit testing independent of the database or UI.

## Shopping List Sync

The shopping list sidebar polls `GET /api/shopping-list` every 30 seconds.

```
Tap product tile on dashboard
  → POST /api/list/add
      → provider.add({ productName })      ← adds task to Google Tasks
      → db.shoppingListItem.upsert(...)    ← caches locally (preserves image)

GET /api/shopping-list (every 30s)
  → provider.list()                        ← fetch incomplete Google Tasks
  → purge local cache rows whose task is gone (checked off on phone)
  → return merged rows (with imageUrl from DB)

Check off in sidebar or swipe-to-dismiss
  → DELETE /api/shopping-list/[itemId]
      → provider.complete(googleTaskId)    ← marks task done in Google Tasks
      → db.shoppingListItem.delete(...)    ← removes from local cache

Clear all
  → DELETE /api/shopping-list
      → provider.clear()                   ← completes + purges all tasks
      → db.shoppingListItem.deleteMany()
```

### List Provider Decision Tree

```
LIST_PROVIDER env var
  ├── google_tasks (recommended)
  │   → Bidirectional sync with Google Tasks API
  │   → Mobile: native Google Tasks app (iOS + Android)
  │   → Setup: see docs/GOOGLE_TASKS_SETUP.md
  │
  ├── apple_reminders
  │   → Write-only via iOS Shortcuts URL scheme
  │   → Mobile: Apple Reminders (iOS/macOS only)
  │   → Dashboard sidebar uses local cache only (no sync back)
  │
  ├── google_keep
  │   → No official API — falls back to google_tasks with a warning
  │
  └── (not set)
      → Local cache only — no external sync
      → Sidebar still works; items added/removed from dashboard only
```

## Product Search

Product search hits three stores concurrently via `src/lib/store-search.ts`:

- **Coles** — RapidAPI (`coles-product-price-api`) — CDN images included
- **Woolworths** — RapidAPI (`woolworths-products-api`) — CDN images included
- **IGA** — HTML scrape of `igashop.com.au` (free, no key required)

A circuit breaker suspends Coles + Woolworths for 1 hour if RapidAPI returns 429 (rate limit), protecting the free-tier 1,000 req/month limit. IGA always runs.

## iOS 12 (iPad mini 3) Compatibility

Several patches were needed for Safari 12 / iOS 12:

| Issue                                            | Fix                                                                   |
| ------------------------------------------------ | --------------------------------------------------------------------- |
| `aspect-ratio` CSS unsupported                   | Padding-bottom trick (`paddingBottom: '100%'`) for square tile images |
| `inset: 0` shorthand unsupported                 | Explicit `top/right/bottom/left: 0` in `globals.css`                  |
| `gap` on flex containers unsupported             | `space-x-*` / `space-y-*` margin utilities throughout                 |
| `dvh` units unsupported                          | Plain `vh` used                                                       |
| `SameSite=Lax` bug (cookies not sent with fetch) | Resolved by removing authentication entirely                          |

## Key Files

| Path                                               | Purpose                                                  |
| -------------------------------------------------- | -------------------------------------------------------- |
| `src/app/dashboard/layout.tsx`                     | Two-column layout: product grid + shopping list sidebar  |
| `src/components/dashboard/ShoppingListSidebar.tsx` | Always-visible sidebar with 30s Google Tasks polling     |
| `src/components/dashboard/ProductTile.tsx`         | Tappable product card; triggers purchase + list add      |
| `src/lib/store-search.ts`                          | Concurrent Coles/Woolworths/IGA search + circuit breaker |
| `src/lib/list-providers/google-tasks.ts`           | Google Tasks API client (add/list/complete/clear)        |
| `src/lib/priority.ts`                              | Pure urgency scoring function                            |
| `prisma/schema.prisma`                             | SQLite schema (Product, ShoppingListItem, PurchaseEvent) |
| `docs/GOOGLE_TASKS_SETUP.md`                       | Step-by-step Google OAuth credential setup               |
| `scripts/google-oauth-setup.ts`                    | CLI helper to obtain a refresh token                     |
