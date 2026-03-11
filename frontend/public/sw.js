// const CACHE_NAME = "screen-cache-v1";
// const IMAGE_CACHE = "image-cache-v1";

// self.addEventListener("install", (event) => {
//   self.skipWaiting();
// });

// self.addEventListener("activate", (event) => {
//   event.waitUntil(self.clients.claim());
// });

// self.addEventListener("fetch", (event) => {
//   const request = event.request;

//   if (request.url.includes("/uploads/")) {
//     event.respondWith(
//       caches.open(IMAGE_CACHE).then((cache) => {
//         return fetch(request)
//           .then((response) => {
//             cache.put(request, response.clone());
//             return response;
//           })
//           .catch(() => {
//             return cache.match(request);
//           });
//       })
//     );
//   }
// });


const CACHE_NAME = "screen-cache-v1";
const MEDIA_CACHE = "media-cache-v1";

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  const request = event.request;

  // Cache images & videos from uploads
  if (request.url.includes("/uploads/")) {
    event.respondWith(
      caches.open(MEDIA_CACHE).then((cache) => {
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

  // Cache API responses
  if (request.url.includes("/api/")) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, clone);
          });
          return response;
        })
        .catch(() => caches.match(request))
    );
  }
});