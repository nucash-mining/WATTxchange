// Kill-switch service worker: an old build registered a cache-first SW at this
// URL and then removed it, stranding returning visitors on a stale cached app
// shell (white page). This replacement wipes every cache, unregisters itself,
// and reloads open tabs. It must stay deployed at /sw.js so any browser still
// running the old worker picks it up on its update check.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.map((k) => caches.delete(k)));
    await self.registration.unregister();
    const clients = await self.clients.matchAll({ type: 'window' });
    clients.forEach((c) => c.navigate(c.url));
  })());
});
