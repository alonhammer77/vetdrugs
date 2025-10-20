// VetDrugs Progressive Web App Service Worker
// -----------------------------------------------------
// This caches the app shell + book.pdf so it works offline
// -----------------------------------------------------

const CACHE = 'vetdrugs-v4';      // bump this number if you update files
const BASE = '/vetdrugs/';

// Files that should always be available offline
const CORE = [
  BASE,
  BASE + 'index.html',
  BASE + 'book.pdf',              // embedded veterinary drug PDF
  BASE + 'manifest.webmanifest',
];

// -----------------------------------------------------
// INSTALL: pre-cache all core files
// -----------------------------------------------------
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE)
      .then((cache) => cache.addAll(CORE))
      .then(() => self.skipWaiting())
  );
});

// -----------------------------------------------------
// ACTIVATE: clean up old caches
// -----------------------------------------------------
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// -----------------------------------------------------
// FETCH: serve cached files first, fall back to network
// -----------------------------------------------------
self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Only handle same-origin requests
  if (url.origin !== location.origin) return;

  // SPA routing fallback
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req).catch(() => caches.match(BASE + 'index.html'))
    );
    return;
  }

  // Cache-first strategy for assets & book
  event.respondWith(
    caches.match(req).then((cached) => {
      return (
        cached ||
        fetch(req)
          .then((res) => {
            const copy = res.clone();
            caches.open(CACHE).then((cache) => cache.put(req, copy));
            return res;
          })
          .catch(() => cached)
      );
    })
  );
});

// -----------------------------------------------------
// MESSAGE: allow manual cache clearing if needed
// -----------------------------------------------------
self.addEventListener('message', (event) => {
  if (event.data === 'clear-cache') {
    caches.keys().then((keys) => keys.forEach((k) => caches.delete(k)));
  }
});
