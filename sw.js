// RepCam service worker: funciona sin conexión una vez cargada.
const V = 'repcam-v20';
const SHELL = ['./', 'index.html', 'config.js?v=20', 'core.js?v=20', 'library.js?v=20', 'cloud.js?v=20', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png'];
self.addEventListener('install', (e) => { e.waitUntil(caches.open(V).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener('activate', (e) => { e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== V).map((k) => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', (e) => {
  const req = e.request; if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin === location.origin) {
    // la app: red primero para recibir actualizaciones, caché si no hay red
    e.respondWith(fetch(req, { cache: 'no-cache' }).then((r) => { const cp = r.clone(); caches.open(V).then((c) => c.put(req, cp)); return r; }).catch(() => caches.match(req).then((r) => r || caches.match('index.html'))));
  } else if (/cdn\.jsdelivr\.net|storage\.googleapis\.com|cdnjs\.cloudflare\.com|www\.gstatic\.com|fonts\.(googleapis|gstatic)\.com/.test(url.host)) {
    // detector, modelo, librerías y fuentes: caché primero (versionados)
    e.respondWith(caches.match(req).then((hit) => hit || fetch(req).then((r) => { if (r.ok || r.type === 'opaque') { const cp = r.clone(); caches.open(V).then((c) => c.put(req, cp)); } return r; })));
  }
});
