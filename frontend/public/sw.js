const CACHE_NAME = "screen-cache-v1";
const IMAGE_CACHE = "image-cache-v1";

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  const request = event.request;

  if (request.url.includes("/uploads/")) {
    event.respondWith(
      caches.open(IMAGE_CACHE).then((cache) => {
        return fetch(request)
          .then((response) => {
            cache.put(request, response.clone());
            return response;
          })
          .catch(() => {
            return cache.match(request);
          });
      })
    );
  }
});