# Architecture

## Overview

```
┌─────────────────────────────────────────────────────┐
│  iPad (Wall Display)                                 │
│  ┌───────────────────────────────────────────────┐  │
│  │  Next.js 14 (App Router)                      │  │
│  │  ┌──────────────────────┐  ┌───────────────┐  │  │
│  │  │  Product Dashboard   │  │  Admin Panel  │  │  │
│  │  └──────────────────────┘  └───────────────┘  │  │
│  └────────────────────┬──────────────────────────┘  │
└───────────────────────│─────────────────────────────┘
                        │ HTTP (localhost / Docker)
┌───────────────────────▼─────────────────────────────┐
│  Next.js API Routes                                  │
│  /api/products  /api/search  /api/list  /api/auth    │
│                        │                             │
│        ┌───────────────┼────────────────┐            │
│        ▼               ▼                ▼            │
│   SQLite DB      Open Food Facts   List Provider     │
│   (Prisma)      (openfoodfacts.org) (Reminders/Tasks)│
│                        │                             │
│              (search & names only)                   │
│                        │                             │
│                        ▼                             │
│               Coles website scrape                   │
│          (product image, on add only)                │
│          falls back to OFF image URL                 │
└─────────────────────────────────────────────────────┘
```

## Tech Rationale

- **Next.js 14 App Router**: Single process handles both SSR and API routes — no separate backend needed. Ideal for a Docker container.
- **SQLite + Prisma**: Zero-infrastructure database for a single-household app. Prisma provides type-safe queries and migration management.
- **Tailwind CSS**: Utility-first with built-in dark mode support via `class` strategy.
- **SWR**: Client-side data fetching with automatic revalidation — product list updates after tapping without a full page reload.

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

## Auth Flow

```
Request → middleware.ts
  → Has valid session cookie?
    Yes → proceed
    No  → redirect /login
         → POST /api/auth/login (password verify)
           → set HttpOnly JWT cookie (jose HS256)
           → redirect /dashboard
```

Password hash stored in `APP_PASSWORD_HASH` env var (bcrypt). Session tokens signed with `SESSION_SECRET`.

## List Integration Decision Tree

```
LIST_PROVIDER env var
  ├── apple_reminders
  │   → Generate shortcuts:// URL
  │   → Return redirectUrl to client
  │   → Client: window.location.href = redirectUrl
  │   → iOS Shortcuts runs, adds to Reminders list
  │
  ├── google_tasks
  │   → Server calls Google Tasks API
  │   → OAuth2 with stored refresh token
  │   → Returns { ok: true }
  │
  └── google_keep
      → Log warning (no official API)
      → Fall back to google_tasks
```
