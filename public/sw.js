// Schulbus Wiliberg - Service Worker
// Datensparsam: aggressives Caching der App-Shell, Stale-while-revalidate
// fuer Navigation, Cache-first fuer Assets. Keine externen Ressourcen.

const CACHE = "schulbus-wiliberg-v2";
const APP_SHELL = [
  "/",
  "/offline",
  "/login",
  "/register",
  "/dashboard",
  "/wappen.svg",
  "/manifest.webmanifest",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((c) => Promise.allSettled(APP_SHELL.map((u) => c.add(u))))
      .catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/")) return; // API immer live

  // Navigation: stale-while-revalidate – sofort aus Cache, im Hintergrund neu
  if (req.mode === "navigate") {
    event.respondWith(
      caches.open(CACHE).then(async (cache) => {
        const cached = await cache.match(req);
        const network = fetch(req)
          .then((res) => {
            if (res.ok) cache.put(req, res.clone());
            return res;
          })
          .catch(() => cached || cache.match("/offline"));
        return cached || network;
      })
    );
    return;
  }

  // statische Assets / Icons / SVG: cache-first
  event.respondWith(
    caches.open(CACHE).then(async (cache) => {
      const cached = await cache.match(req);
      if (cached) return cached;
      try {
        const res = await fetch(req);
        if (res.ok && res.type === "basic") cache.put(req, res.clone());
        return res;
      } catch {
        return cached || new Response("", { status: 504 });
      }
    })
  );
});

// Push-Benachrichtigungen
self.addEventListener("push", (event) => {
  let data = { title: "Schulbus Wiliberg", body: "", url: "/", tag: "wili" };
  try {
    if (event.data) data = { ...data, ...event.data.json() };
  } catch {
    if (event.data) data.body = event.data.text();
  }
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
      tag: data.tag,
      data: { url: data.url },
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || "/";
  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clients) => {
        for (const c of clients) {
          if ("focus" in c) {
            c.focus();
            if ("navigate" in c) c.navigate(url);
            return;
          }
        }
        return self.clients.openWindow(url);
      })
  );
});
