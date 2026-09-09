const CACHE_NAME = 'pocket-khorcha-cache-v3';
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.svg',
  '/favicon.ico',
  '/icons.svg',
];

// Install: precache initial assets and activate immediately
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS).catch((err) => {
        console.warn('[SW] Pre-cache error:', err);
      });
    })
  );
  self.skipWaiting();
});

// Activate: delete all outdated caches immediately and claim clients
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[SW] Clearing old cache:', key);
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event: Network-first for seamless live updates, fallback to cache when offline
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests and non-http protocols
  if (request.method !== 'GET' || !url.protocol.startsWith('http')) {
    return;
  }

  // Skip backend API routes (handled by IndexedDB & offline sync queue)
  if (url.pathname.startsWith('/api')) {
    return;
  }

  // Skip Vite HMR websocket / dev requests if on localhost
  if (url.pathname.startsWith('/@') || url.pathname.includes('vite')) {
    return;
  }

  // Navigation requests (HTML page): Network-first, fallback to cached index.html
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(async () => {
          const cached = await caches.match(request, { ignoreSearch: true });
          if (cached) return cached;
          const indexCached = await caches.match('/index.html', { ignoreSearch: true });
          if (indexCached) return indexCached;
          return caches.match('/', { ignoreSearch: true });
        })
    );
    return;
  }

  // Static Assets & Scripts: Network-first, fallback to cache when offline
  event.respondWith(
    fetch(request)
      .then((networkRes) => {
        if (networkRes && networkRes.status === 200) {
          const clone = networkRes.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        }
        return networkRes;
      })
      .catch(async () => {
        const cached = await caches.match(request, { ignoreSearch: true });
        if (cached) return cached;

        // If offline and request is an image/icon, fallback to favicon.svg
        if (request.destination === 'image' || url.pathname.endsWith('.svg') || url.pathname.endsWith('.ico')) {
          const fallbackImg = await caches.match('/favicon.svg', { ignoreSearch: true });
          if (fallbackImg) return fallbackImg;
        }

        const matchPath = await caches.match(url.pathname, { ignoreSearch: true });
        if (matchPath) return matchPath;
      })
  );
});
