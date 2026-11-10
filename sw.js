var CACHE = "friday-game-v1";
var FILES = ["./", "./index.html", "./manifest.webmanifest", "./icon-192.png"];

self.addEventListener("install", function (e) {
  e.waitUntil(
    caches.open(CACHE).then(function (c) {
      return Promise.all(FILES.map(function (f) { return c.add(f).catch(function () {}); }));
    })
  );
});

self.addEventListener("activate", function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener("message", function (e) {
  if (e.data === "SKIP") self.skipWaiting();
});

self.addEventListener("fetch", function (e) {
  if (e.request.method !== "GET") return;
  e.respondWith(
    fetch(e.request).then(function (r) {
      var copy = r.clone();
      caches.open(CACHE).then(function (c) { c.put(e.request, copy); }).catch(function () {});
      return r;
    }).catch(function () {
      return caches.match(e.request).then(function (m) { return m || caches.match("./index.html"); });
    })
  );
});
