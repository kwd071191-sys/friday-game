// غيّر رقم النسخة كل ما عدّلت index.html عشان يظهر للاعبين زر "تحديث جديد"
var VER = "friday-game-v3-naser";
var CORE = ["./", "index.html", "manifest.webmanifest", "icon-192.png", "icon-512.png"];

self.addEventListener("install", function (e) {
  e.waitUntil(
    caches.open(VER).then(function (c) {
      return Promise.all(CORE.map(function (u) { return c.add(u).catch(function () {}); }));
    })
  );
});

self.addEventListener("activate", function (e) {
  e.waitUntil(
    caches.keys().then(function (ks) {
      return Promise.all(ks.filter(function (k) { return k !== VER; }).map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

// الصفحة ترسل "SKIP" لما اللاعب يضغط زر التحديث
self.addEventListener("message", function (e) {
  if (e.data === "SKIP") self.skipWaiting();
});

self.addEventListener("fetch", function (e) {
  var r = e.request;
  if (r.method !== "GET") return;
  var url = new URL(r.url);

  // الصفحة نفسها: الشبكة أول، وإذا ما فيه نت نفتح من الكاش
  if (r.mode === "navigate") {
    e.respondWith(
      fetch(r).then(function (res) {
        var cp = res.clone();
        caches.open(VER).then(function (c) { c.put("index.html", cp); });
        return res;
      }).catch(function () {
        return caches.match("index.html").then(function (m) { return m || caches.match("./"); });
      })
    );
    return;
  }

  // باقي الملفات (أيقونات، خط Cairo): من الكاش وتتحدث بالخلفية
  if (url.origin === location.origin || url.hostname.indexOf("fonts.g") === 0) {
    e.respondWith(
      caches.match(r).then(function (m) {
        var net = fetch(r).then(function (res) {
          if (res && (res.status === 200 || res.type === "opaque")) {
            var cp = res.clone();
            caches.open(VER).then(function (c) { c.put(r, cp); });
          }
          return res;
        }).catch(function () { return m; });
        return m || net;
      })
    );
  }
});
