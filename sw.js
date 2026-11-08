/* Service worker للعبة الجمعة
   - غيّر رقم VERSION كل ما رفعت نسخة جديدة عشان يطلع للاعب زر "فيه تحديث جديد" */
var VERSION = "friday-v3";
var FILES = ["./", "./index.html", "./manifest.webmanifest", "./icon-192.png"];

self.addEventListener("install", function (e) {
  e.waitUntil(
    caches.open(VERSION).then(function (c) {
      /* نضيف كل ملف لحاله عشان لو ناقص ملف (مثل الأيقونة) ما يفشل التثبيت كله */
      return Promise.all(FILES.map(function (f) { return c.add(f).catch(function () {}); }));
    })
  );
});

self.addEventListener("activate", function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) { return k !== VERSION; }).map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

/* زر التحديث في اللعبة يرسل "SKIP" */
self.addEventListener("message", function (e) {
  if (e.data === "SKIP") self.skipWaiting();
});

self.addEventListener("fetch", function (e) {
  var req = e.request;
  if (req.method !== "GET") return;
  var url = new URL(req.url);

  /* الصفحة نفسها: الشبكة أولًا عشان توصل التحديثات، وإذا ما فيه نت نستخدم النسخة المحفوظة */
  if (req.mode === "navigate") {
    e.respondWith(
      fetch(req).then(function (r) {
        var copy = r.clone();
        caches.open(VERSION).then(function (c) { c.put("./index.html", copy); });
        return r;
      }).catch(function () {
        return caches.match("./index.html").then(function (m) { return m || caches.match("./"); });
      })
    );
    return;
  }

  /* باقي الملفات (الخط، الأيقونة...): المحفوظ أولًا ثم الشبكة */
  if (url.origin === location.origin || url.hostname.indexOf("fonts.g") === 0) {
    e.respondWith(
      caches.match(req).then(function (m) {
        return m || fetch(req).then(function (r) {
          if (r && (r.status === 200 || r.type === "opaque")) {
            var copy = r.clone();
            caches.open(VERSION).then(function (c) { c.put(req, copy); });
          }
          return r;
        }).catch(function () { return m; });
      })
    );
  }
});
