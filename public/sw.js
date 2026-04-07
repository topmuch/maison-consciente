/* ═══════════════════════════════════════════════════════
   MAISON CONsciente — Service Worker v2
   
   Stratégie: Stale-While-Revalidate pour les assets,
   Network-First pour les API, Cache-First pour le reste.
   
   • Version: maison-consciente-v2
   • Cache API: Network-first (always fresh data)
   • Cache Static: Stale-while-revalidate
   • Cache Images: Cache-first (30 days)
   ═══════════════════════════════════════════════════════ */

const CACHE_VERSION = "maison-consciente-v2";
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const IMAGE_CACHE = `${CACHE_VERSION}-images`;

// Assets statiques à pré-cacher
const PRECACHE_URLS = [
  "/",
  "/manifest.json",
  "/logo.svg",
];

// ─── Install ───
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(PRECACHE_URLS))
  );
  self.skipWaiting();
});

// ─── Activate ───
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== STATIC_CACHE && key !== IMAGE_CACHE)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// ─── Fetch ───
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET
  if (request.method !== "GET") return;

  // Skip API calls — toujours en direct
  if (url.pathname.startsWith("/api/")) return;

  // Skip SSE
  if (url.pathname.startsWith("/api/sse")) return;

  // Skip Chrome extensions
  if (url.protocol === "chrome-extension:") return;

  // ─── Images: Cache-First ───
  if (
    request.destination === "image" ||
    url.pathname.match(/\.(png|jpg|jpeg|svg|gif|webp|ico)$/i)
  ) {
    event.respondWith(
      caches.open(IMAGE_CACHE).then((cache) =>
        cache.match(request).then((cached) => {
          if (cached) return cached;
          return fetch(request)
            .then((response) => {
              if (response.ok) {
                cache.put(request, response.clone());
              }
              return response;
            })
            .catch(() => new Response("Offline", { status: 503 }));
        })
      )
    );
    return;
  }

  // ─── Static Assets: Stale-While-Revalidate ───
  event.respondWith(
    caches.open(STATIC_CACHE).then((cache) =>
      cache.match(request).then((cached) => {
        const fetchPromise = fetch(request)
          .then((response) => {
            if (response.ok) {
              cache.put(request, response.clone());
            }
            return response;
          })
          .catch(() => cached || new Response("Offline", { status: 503 }));

        return cached || fetchPromise;
      })
    )
  );
});

// ─── Push Notifications (placeholder pour V2) ───
self.addEventListener("push", (event) => {
  const data = event.data?.json() || { title: "Maison Consciente", body: "Nouvelle notification" };
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: "/logo.svg",
      badge: "/logo.svg",
      vibrate: [100, 50, 100],
      data: data.url || "/",
    })
  );
});
