const CACHE_NAME = 'pocket-khorcha-cache-v1';
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.svg',
  '/favicon.ico',
  '/icons.svg',
];

// Install: precache initial assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS).catch((err) => {
        console.warn('Pre-cache error:', err);
      });
    })
  );
  self.skipWaiting();
});

// Activate: claim clients immediately
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME && key.startsWith('pocket-khorcha-')) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests and browser extensions
  if (request.method !== 'GET' || !url.protocol.startsWith('http')) {
    return;
  }

  // Skip API routes - IndexedDB & API layer handles offline data directly
  if (url.pathname.startsWith('/api')) {
    return;
  }

  // Navigation requests: return index.html when offline
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

  // Static Assets (JS, CSS, SVGs, Fonts, Images)
  event.respondWith(
    caches.match(request, { ignoreSearch: true }).then((cached) => {
      if (cached) {
        // If online, refresh cache in background
        if (navigator.onLine) {
          fetch(request)
            .then((networkRes) => {
              if (networkRes && networkRes.status === 200) {
                const clone = networkRes.clone();
                caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
              }
            })
            .catch(() => {});
        }
        return cached;
      }

      // Not in cache: fetch from network and store for offline use
      return fetch(request)
        .then((networkRes) => {
          if (networkRes && networkRes.status === 200) {
            const clone = networkRes.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return networkRes;
        })
        .catch(async () => {
          // If offline and request is an image/icon, fallback to favicon.svg
          if (request.destination === 'image' || url.pathname.endsWith('.svg') || url.pathname.endsWith('.ico')) {
            const fallbackImg = await caches.match('/favicon.svg', { ignoreSearch: true });
            if (fallbackImg) return fallbackImg;
          }
          // Try matching pathname only without host or query
          const matchPath = await caches.match(url.pathname, { ignoreSearch: true });
          if (matchPath) return matchPath;
        });
    })
  );
});
