/* 迪高售後 PWA：HTML/JS/CSS network-first；圖示／manifest cache-first */
const CACHE = "ecdeco-cs-v3";
const ASSETS = [
  "./",
  "./index.html",
  "./css/styles.css",
  "./js/data.js",
  "./js/report-config.js",
  "./js/app.js",
  "./manifest.webmanifest",
  "./assets/logo.png",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/apple-touch-icon.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
      )
      .then(() => self.clients.claim())
  );
});

function isSameOrigin(url) {
  return url.origin === self.location.origin;
}

function isHtmlRequest(req, url) {
  if (req.mode === "navigate") return true;
  if (req.destination === "document") return true;
  const p = url.pathname;
  return p.endsWith(".html") || p.endsWith("/") || p === "" || /\/index\.html?$/.test(p);
}

function isScriptOrStyle(req, url) {
  const dest = req.destination;
  if (dest === "script" || dest === "style") return true;
  const p = url.pathname;
  return p.endsWith(".js") || p.endsWith(".css");
}

function isCacheFirstAsset(req, url) {
  const dest = req.destination;
  if (dest === "image" || dest === "font") return true;
  const p = url.pathname;
  return (
    p.includes("/icons/") ||
    p.includes("/assets/") ||
    p.endsWith(".webmanifest") ||
    p.endsWith("manifest.webmanifest") ||
    /\.(png|jpe?g|gif|webp|svg|ico|woff2?)$/i.test(p)
  );
}

function networkFirst(req) {
  return fetch(req)
    .then((res) => {
      if (res && res.ok) {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(req, copy));
      }
      return res;
    })
    .catch(() =>
      caches.match(req).then((cached) => {
        if (cached) return cached;
        if (req.mode === "navigate") return caches.match("./index.html");
        return undefined;
      })
    );
}

function cacheFirst(req) {
  return caches.match(req).then((cached) => {
    if (cached) return cached;
    return fetch(req).then((res) => {
      if (res && res.ok) {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(req, copy));
      }
      return res;
    });
  });
}

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  let url;
  try {
    url = new URL(req.url);
  } catch {
    return;
  }
  if (!isSameOrigin(url)) return;

  if (isHtmlRequest(req, url) || isScriptOrStyle(req, url)) {
    event.respondWith(networkFirst(req));
    return;
  }

  if (isCacheFirstAsset(req, url)) {
    event.respondWith(cacheFirst(req));
    return;
  }

  // 其他同域 GET：network-first
  event.respondWith(networkFirst(req));
});
