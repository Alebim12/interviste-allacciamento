// Cache per l'uso offline. Cambiando VERSION i dispositivi scaricano la nuova versione.
const VERSION = 'interviste-1.0';
const FILES = ['./', 'index.html', 'manifest.webmanifest', 'icona-192.png', 'icona-512.png'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
// rete prima (versione aggiornata), cache se offline.
// Non salva mai una pagina di login (es. Cloudflare Access): solo risposte dirette dal sito.
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    fetch(e.request).then(r => {
      const own = r.ok && !r.redirected && r.type === 'basic' && new URL(r.url).origin === location.origin;
      if (own && new URL(e.request.url).origin === location.origin) {
        const copy = r.clone(); caches.open(VERSION).then(c => c.put(e.request, copy));
      }
      return r;
    }).catch(() => caches.match(e.request, { ignoreSearch: true }).then(r => r || caches.match('index.html')))
  );
});
