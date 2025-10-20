const CACHE = 'vetdrugs-v3';
const BASE = '/vetdrugs/';
const BOOK_CACHE_URL = '/vetdrugs/book.pdf';

const CORE = [

  BASE,
  BASE + 'index.html',
  BASE + 'book.pdf',      // ← add this line
];

];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(CORE)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (url.origin !== location.origin) return;

  // SPA fallback
  if (e.request.mode === 'navigate') {
    e.respondWith(fetch(e.request).catch(() => caches.match(BASE + 'index.html')));
    return;
  }

  // Cache-first for all assets and book.pdf
  if (url.pathname.startsWith(BASE)) {
    e.respondWith(
      caches.match(e.request).then((cached) =>
        cached ||
        fetch(e.request).then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(e.request, copy));
          return res;
        }).catch(() => cached)
      )
    );
  }
});
