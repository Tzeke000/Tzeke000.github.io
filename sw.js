/* Tzeke000 Studios — minimal offline-first service worker */
const VERSION = "tzeke-v2";
const PRECACHE = [
  "/",
  "/index.html",
  "/bio.html",
  "/music.html",
  "/social.html",
  "/contact.html",
  "/epk.html",
  "/discography.html",
  "/listen.html",
  "/404.html",
  "/styles.css",
  "/main.js",
  "/Tzeke000icon.png",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/manifest.webmanifest"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(VERSION).then((cache) => cache.addAll(PRECACHE)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // skip cross-origin

  // HTML, CSS and JS: network-first so site updates reach returning visitors,
  // fall back to cache (and to 404.html offline)
  const isCode = /\.(css|js|json)$/.test(url.pathname);
  if (isCode || req.mode === "navigate" || (req.headers.get("accept") || "").includes("text/html")) {
    event.respondWith(
      fetch(req).then((res) => {
        if (res.ok) {
          const copy = res.clone();
          caches.open(VERSION).then((c) => c.put(req, copy));
        }
        return res;
      }).catch(() => caches.match(req).then((r) => r || (isCode ? Response.error() : caches.match("/404.html"))))
    );
    return;
  }

  // Static assets: cache-first, fall back to network
  event.respondWith(
    caches.match(req).then((cached) =>
      cached || fetch(req).then((res) => {
        if (res.ok) {
          const copy = res.clone();
          caches.open(VERSION).then((c) => c.put(req, copy));
        }
        return res;
      }).catch(() => cached)
    )
  );
});
