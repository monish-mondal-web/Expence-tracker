const CACHE_NAME = 'pocket-khorcha-v3';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.svg',
  '/favicon.ico',
  '/icons.svg',
];

// Install: pre-cache critical application shell assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('SW: Some assets failed to pre-cache', err);
      });
    })
  );
  self.skipWaiting();
});

// Activate: clean up old caches and claim clients immediately
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch strategy
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // 1. Skip non-GET requests and chrome-extension / external requests
  if (request.method !== 'GET' || !url.protocol.startsWith('http')) {
    return;
  }

  // 2. Skip API requests - API layer has its own IndexedDB offline cache
  if (url.pathname.startsWith('/api')) {
    return;
  }

  // 3. Navigation requests (SPA page routes like /, /settings, /budget, /expenses, /calendar)
  if (request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          // If online, fetch fresh HTML and update cache
          if (navigator.onLine) {
            const networkResponse = await fetch(request);
            if (networkResponse && networkResponse.status === 200) {
              const cache = await caches.open(CACHE_NAME);
              cache.put(request, networkResponse.clone());
              cache.put('/index.html', networkResponse.clone());
              cache.put('/', networkResponse.clone());
            }
            return networkResponse;
          }
        } catch (err) {
          // Network failed, proceed to cache fallback
        }

        // Offline or network error: return cached HTML shell
        const cached = await caches.match(request, { ignoreSearch: true });
        if (cached) return cached;

        const indexCached = await caches.match('/index.html', { ignoreSearch: true });
        if (indexCached) return indexCached;

        const rootCached = await caches.match('/', { ignoreSearch: true });
        if (rootCached) return rootCached;

        return new Response('<h1>Pocket Khorcha Offline</h1><p>Please reload when connected once.</p>', {
          headers: { 'Content-Type': 'text/html' },
        });
      })()
    );
    return;
  }

  // 4. Static assets (JS, CSS, fonts, images)
  event.respondWith(
    (async () => {
      // Step A: Check cache first (with ignoreSearch)
      const cached = (await caches.match(request, { ignoreSearch: true })) ||
                     (await caches.match(url.pathname, { ignoreSearch: true }));

      if (cached) {
        // If online, revalidate in background quietly without blocking
        if (navigator.onLine) {
          fetch(request)
            .then(async (networkResponse) => {
              if (networkResponse && networkResponse.status === 200) {
                const cache = await caches.open(CACHE_NAME);
                cache.put(request, networkResponse.clone());
                cache.put(url.pathname, networkResponse.clone());
              }
            })
            .catch(() => {});
        }
        return cached;
      }

      // Step B: Not in cache - try network
      if (navigator.onLine) {
        try {
          const networkResponse = await fetch(request);
          if (networkResponse && networkResponse.status === 200) {
            const cache = await caches.open(CACHE_NAME);
            cache.put(request, networkResponse.clone());
            cache.put(url.pathname, networkResponse.clone());
          }
          return networkResponse;
        } catch (err) {
          // Network failed
        }
      }

      // Step C: Offline & not found by exact URL -> Search cache by filename
      const cache = await caches.open(CACHE_NAME);
      const keys = await cache.keys();
      const filename = url.pathname.split('/').pop();

      if (filename) {
        const matchedKey = keys.find((k) => {
          const keyPath = new URL(k.url).pathname;
          return keyPath === url.pathname || keyPath.endsWith(filename);
        });
        if (matchedKey) {
          const matchedResponse = await cache.match(matchedKey);
          if (matchedResponse) return matchedResponse;
        }
      }

      // Step D: Image fallback
      if (request.destination === 'image' || url.pathname.endsWith('.svg') || url.pathname.endsWith('.ico')) {
        const svgFallback = await cache.match('/favicon.svg', { ignoreSearch: true });
        if (svgFallback) return svgFallback;
      }

      // Return empty JS or empty CSS response if offline to prevent crashing script loader
      if (url.pathname.endsWith('.js') || url.pathname.endsWith('.jsx') || request.destination === 'script') {
        return new Response('/* offline script placeholder */', {
          headers: { 'Content-Type': 'application/javascript' },
        });
      }

      if (url.pathname.endsWith('.css') || request.destination === 'style') {
        return new Response('/* offline style placeholder */', {
          headers: { 'Content-Type': 'text/css' },
        });
      }

      return new Response('', { status: 404, statusText: 'Offline Asset Not Found' });
    })()
  );
});
