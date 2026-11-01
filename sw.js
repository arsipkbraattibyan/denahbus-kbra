/* Service worker Denah Bus KB RA At Tibyan
 * - index.html, manifest, dan script: ambil dari internet dulu (selalu versi terbaru), cadangan dari penyimpanan jika offline.
 * - gambar, suara, font: pakai simpanan lalu perbarui di belakang.
 * Setiap kali mengganti file di hosting, cukup naikkan angka VERSION agar simpanan lama dibuang. */
var VERSION = 'v22';
var CACHE = 'denah-bus-' + VERSION;
var PRECACHE = ['./', 'index.html', 'manifest.webmanifest', 'logo.png', 'salam.mp3'];

self.addEventListener('install', function (e) {
  e.waitUntil(
    caches.open(CACHE).then(function (c) {
      return Promise.all(PRECACHE.map(function (u) { return c.add(u).catch(function () { /* file belum ada: lewati */ }); }));
    }).then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

function networkFirst(req) {
  return fetch(req).then(function (res) {
    if (res && res.ok) { var copy = res.clone(); caches.open(CACHE).then(function (c) { c.put(req, copy); }); }
    return res;
  }).catch(function () {
    return caches.match(req).then(function (hit) { return hit || caches.match('index.html'); });
  });
}

function staleWhileRevalidate(req) {
  return caches.match(req).then(function (hit) {
    var net = fetch(req).then(function (res) {
      if (res && res.ok) { var copy = res.clone(); caches.open(CACHE).then(function (c) { c.put(req, copy); }); }
      return res;
    }).catch(function () { return hit; });
    return hit || net;
  });
}

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;
  var url = new URL(req.url);
  if (url.origin !== self.location.origin) return;            // Google Apps Script & font: biarkan langsung ke jaringan
  var path = url.pathname;
  var isCode = req.mode === 'navigate' || /\.(html|js|webmanifest|json)$/.test(path) || path.slice(-1) === '/';
  e.respondWith(isCode ? networkFirst(req) : staleWhileRevalidate(req));
});
