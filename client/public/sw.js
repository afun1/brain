const CACHE_NAME = 'binaural-sleep-v1';
const STATIC_ASSETS = [
  '/',
  '/favicon.png',
  '/pwa-192x192.png',
  '/pwa-512x512.png'
];

const STATIC_EXTENSIONS = ['.js', '.css', '.html', '.png', '.svg', '.ico', '.woff', '.woff2', '.ttf'];

function isStaticAsset(url) {
  const pathname = new URL(url).pathname;
  if (pathname.startsWith('/api/')) return false;
  return STATIC_EXTENSIONS.some(ext => pathname.endsWith(ext)) || pathname === '/';
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('Failed to cache some assets:', err);
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  if (!isStaticAsset(event.request.url)) return;
  
  event.respondWith(
    caches.match(event.request).then((cached) => {
      const fetchPromise = fetch(event.request).then((response) => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, clone);
          });
        }
        return response;
      }).catch(() => cached);
      
      return cached || fetchPromise;
    })
  );
});
