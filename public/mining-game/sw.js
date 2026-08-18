// Mining Game PWA service worker — offline shell for the /mining-game/ scope.
//
// Strategy: network-first for the game shell (index.html changes on every
// redeploy and must never go stale), cache-first for everything else the page
// pulls from this scope or the CDNs (three.js, ethers, GLB models from the
// ordinal gateways — all immutable by content or by version pin).
const CACHE = "mining-game-v2";
const SHELL = ["./", "./index.html", "./manifest.webmanifest", "./icon-192.png", "./icon-512.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});
self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  const isShell = url.origin === location.origin &&
    (url.pathname.endsWith("/index.html") || url.pathname.endsWith("/mining-game/") || url.pathname.endsWith("/manifest.webmanifest"));
  if (isShell) {
    // network-first: fresh game if online, cached shell if not
    e.respondWith(
      fetch(req).then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(req, copy));
        return res;
      }).catch(() => caches.match(req, { ignoreSearch: true }))
    );
    return;
  }
  // cache-first for immutable assets (CDN libs, ordinal-content GLBs, icons)
  e.respondWith(
    caches.match(req).then((hit) => hit ||
      fetch(req).then((res) => {
        if (res.ok && (res.type === "basic" || res.type === "cors")) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
        }
        return res;
      })
    )
  );
});
