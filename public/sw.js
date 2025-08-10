const CACHE_NAME = 'wattxchange-v1.0.0';
const urlsToCache = [
  '/',
  '/manifest.json',
  '/WATTxchange logo.png',
  '/BTC logo.png',
  '/ETH logo.png',
  '/LTC logo.png',
  '/XMR logo.png',
  '/Altcoinchain logo.png',
  '/WATT logo.png',
  '/GHOST logo.png',
  '/TROLL logo.png',
  '/HTH logo.webp',
  '/RTM logo.png'
];

self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', function(event) {
  event.respondWith(
    caches.match(event.request)
      .then(function(response) {
        // Return cached version or fetch from network
        return response || fetch(event.request);
      }
    )
  );
});

self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.map(function(cacheName) {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});