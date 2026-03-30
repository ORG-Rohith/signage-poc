const CACHE_NAME = "screen-cache-v1";
const MEDIA_CACHE = "media-cache-v1";

self.addEventListener("install", (event) => {
  console.log("Service Worker Installed");

  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(["/"]);
    }),
  );

  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  console.log("Service Worker Activated");
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  const request = event.request;

  if (request.url.includes("/uploads/")) {
    event.respondWith(cacheFirst(request));
    return;
  }

  if (request.url.includes("/api/")) {
    event.respondWith(networkFirst(request));
    return;
  }

  event.respondWith(networkFirst(request));
});

async function cacheFirst(request) {
  const cache = await caches.open(MEDIA_CACHE);

  const cached = await cache.match(request);
  if (cached) {
    return cached;
  }

  try {
    const response = await fetch(request);
    cache.put(request, response.clone());
    return response;
  } catch (error) {
    return cached;
  }
}

async function networkFirst(request) {
  const cache = await caches.open(CACHE_NAME);

  try {
    const response = await fetch(request);
    cache.put(request, response.clone());
    return response;
  } catch (error) {
    const cached = await cache.match(request);
    return cached;
  }
}
