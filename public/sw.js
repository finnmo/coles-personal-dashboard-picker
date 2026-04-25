const CACHE_NAME = 'dashboard-v1'
const SHELL_URLS = ['/offline.html', '/manifest.json']

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_URLS)))
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
      )
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Only handle same-origin requests
  if (url.origin !== self.location.origin) return

  // /api/products GET — stale-while-revalidate
  if (url.pathname.startsWith('/api/products') && request.method === 'GET') {
    event.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => {
        const cached = await cache.match(request)
        const fetchPromise = fetch(request).then((res) => {
          if (res.ok) cache.put(request, res.clone())
          return res
        })
        return cached ?? fetchPromise
      })
    )
    return
  }

  // Navigation requests — network-first with 3s timeout, fallback to shell
  if (request.mode === 'navigate') {
    event.respondWith(
      Promise.race([
        fetch(request),
        new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 3000)),
      ]).catch(() => caches.match('/offline.html'))
    )
    return
  }

  // Everything else — network-first, no fallback
  event.respondWith(fetch(request).catch(() => new Response('', { status: 503 })))
})
