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

### GET /api/products?store=COLES|IGA

Returns products sorted descending by priority score.

```typescript
{
  products: Array<{
    id: string
    name: string
    imageUrl: string | null
    store: 'COLES' | 'IGA'
    colesProductId: string | null
    igaProductId: string | null
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
Body:    { name, imageUrl?, store, colesProductId?, igaProductId?, repurchaseIntervalDays? }
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

### GET /api/search/coles?q=<query>

Proxies to Coles API. Used in admin panel only.

```typescript
{
  results: Array<{
    colesProductId: string
    name: string
    imageUrl: string
    brand: string | null
    packageSize: string | null
    price: number | null
  }>
}
```

Note: Rate limiting may apply from the upstream Coles API.

### GET /api/search/iga?q=<query>

```
501: { error: "IGA search not yet implemented" }
```

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
