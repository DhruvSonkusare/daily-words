// Saves the app files on the phone so it opens fast and works offline.
// Change CACHE_NAME when you change any file, so phones get the new version.
var CACHE_NAME = "daily-words-v1";
var FILES = ["./", "index.html", "style.css", "words.js", "logic.js", "app.js", "icon.svg", "manifest.webmanifest"];

self.addEventListener("install", function (event) {
  event.waitUntil(caches.open(CACHE_NAME).then(function (cache) { return cache.addAll(FILES); }));
  self.skipWaiting();
});

self.addEventListener("activate", function (event) {
  event.waitUntil(
    caches.keys().then(function (names) {
      return Promise.all(names.filter(function (n) { return n !== CACHE_NAME; }).map(function (n) { return caches.delete(n); }));
    })
  );
  self.clients.claim();
});

// Use the saved copy first; fall back to the network.
self.addEventListener("fetch", function (event) {
  event.respondWith(
    caches.match(event.request).then(function (saved) { return saved || fetch(event.request); })
  );
});
