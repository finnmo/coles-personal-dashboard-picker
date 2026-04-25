# API Reference

All endpoints except `/api/health` and `/api/auth/login` require a valid session cookie.

## Auth

### POST /api/auth/login

```
Body:    { "password": string }
200 OK:  { "ok": true }           + Set-Cookie: session=<jwt>
401:     { "error": "Invalid password" }
```

### POST /api/auth/logout

```
200 OK:  { "ok": true }           + clears session cookie
```

## Products

### GET /api/products

Returns all products sorted descending by priority score.

```typescript
{
  products: Array<{
    id: string
    name: string
    imageUrl: string | null
    offProductId: string | null
    repurchaseIntervalDays: number
    lastPurchasedAt: string | null // ISO 8601
    priorityScore: number
    isOverdue: boolean // score >= 1.0
    isNew: boolean // never purchased
    daysSinceLastPurchase: number | null
  }>
}
```

### POST /api/products

```
Body:    { name, imageUrl?, offProductId?, repurchaseIntervalDays? }
201:     { product: Product }
409:     { error: "Product already exists" }
```

### PATCH /api/products/[id]

```
Body:    { name?, imageUrl?, repurchaseIntervalDays? }
200:     { product: Product }
404:     { error: "Not found" }
```

### DELETE /api/products/[id]

```
200:     { ok: true }
404:     { error: "Not found" }
```

### POST /api/products/[id]/purchase

Sets `lastPurchasedAt` to current timestamp.

```
200:     { ok: true, lastPurchasedAt: string }
404:     { error: "Not found" }
```

## Search

### GET /api/search?q=\<query\>

Searches the Open Food Facts catalogue (filtered to Australian products). Used in admin panel only.

```typescript
{
  results: Array<{
    offProductId: string // EAN barcode
    name: string
    imageUrl: string | null
    brand: string | null
    quantity: string | null // e.g. "2L", "500g"
  }>
}
```

Errors:

- `429` — upstream rate limit
- `502` — Open Food Facts unavailable

## List

### POST /api/list/add

Adds item to configured list provider and marks product as purchased.

```
Body:    { "productId": string }
200:     { "ok": true, "provider": "apple_reminders" | "google_tasks", "redirectUrl"?: string }
         // redirectUrl is present only for apple_reminders — client should open it
404:     { "error": "Product not found" }
500:     { "error": string }
```

## Health

### GET /api/health

No auth required. Used by Docker health check.

```
200:     { "status": "ok", "timestamp": string }
```
