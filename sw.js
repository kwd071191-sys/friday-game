/* Service Worker — لعبة الجمعة
   غيّر رقم النسخة (VER) كل ما رفعت تحديث على GitHub عشان تنزل النسخة الجديدة عند اللاعبين. */
var VER = "jumaa-v3";
var FILES = ["./", "./index.html", "./manifest.webmanifest", "./icon-192.png", "./icon-512.png"];

self.addEventListener("install", function (e) {
  /* ما نسوي skipWaiting هنا: اللعبة تعرض زر "فيه تحديث جديد" وترسل SKIP لما اللاعب يضغط عليه */
  e.waitUntil(
    caches.open(VER).then(function (c) {
      return Promise.all(FILES.map(function (f) {
        return c.add(f).catch(function () {}); /* لو ملف ناقص (مثل الأيقونة) ما ينكسر التثبيت */
      }));
    })
  );
});

self.addEventListener("message", function (e) {
  if (e.data === "SKIP") self.skipWaiting();
});

self.addEventListener("activate", function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) { return k !== VER; }).map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener("fetch", function (e) {
  var req = e.request;
  if (req.method !== "GET") return;
  var url = new URL(req.url);
  if (url.origin !== location.origin) return; /* خطوط جوجل وغيرها تمر عادي */

  /* صفحة اللعبة: الشبكة أولًا (عشان التحديثات)، وإذا ما فيه نت نرجع للمحفوظ */
  if (req.mode === "navigate" || url.pathname.endsWith("/index.html")) {
    e.respondWith(
      fetch(req).then(function (res) {
        var copy = res.clone();
        caches.open(VER).then(function (c) { c.put("./index.html", copy); });
        return res;
      }).catch(function () {
        return caches.match("./index.html").then(function (r) { return r || caches.match("./"); });
      })
    );
    return;
  }

  /* باقي الملفات: المحفوظ أولًا */
  e.respondWith(
    caches.match(req).then(function (hit) {
      return hit || fetch(req).then(function (res) {
        if (res && res.ok) {
          var copy = res.clone();
          caches.open(VER).then(function (c) { c.put(req, copy); });
        }
        return res;
      });
    })
  );
});
