const cacheableExtensions = [
  "png",
  "jpeg",
  "jpg",
  "gif",
  "webp",
  "css",
  "css2",
  "svg",
  "",
  "js",
  "http",
  "font",
  "webmanifest"
];
const isCacheableDomain = (url) => {
  if (url.includes("fonts.gstatic.com")) {
    return true;
  }
  if (url.includes("fonts.googleapis.com")) {
    return true;
  }
  return false;
};
const isCacheableRequest = (request) => {
  const url = request.url.toLowerCase();
  if (url.includes("worker.js")) {
    return false;
  }
  const extension = url.split("?")[0].split(".").pop().trim().toLowerCase();
  if (extension === "") {
    return true;
  }
  return cacheableExtensions.includes(extension) || isCacheableDomain(url);
};
const getCachedOrFetch = async (cacheName, request) => {
  let response = await caches.match(request);
  console.log("Checking cache for: " + request.url);
  if (response && response.status >= 200 && response.status < 300) {
    console.log("Found cached response for: " + request.url);
    return response;
  }
  response = await fetch(request);
  if (response.status < 200 && response.status >= 300) ;
  console.log("fetched response for: " + request.url);
  const cache = await caches.open(cacheName);
  await cache.put(request, response);
  console.log("Put in cache:" + request.url);
  return response;
};
const CACHE_NAME = "pnp-web-cache";
const urlsToCache = [
  "/",
  "index.html",
  "/index.html",
  "assets/index.js",
  // Your main JavaScript file
  "assets/index.css",
  "assets/toastify.min.css",
  "doc-cam-apple-touch-icon.png",
  "favicon.ico",
  "site.webmanifest",
  "https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&icon_names=cached,cameraswitch,close,no_photography,photo_camera,visibility,visibility_off"
];
console.log("Loading service worker");
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      for (const url of urlsToCache) {
        console.log("Caching URL: ", url);
        try {
          await cache.add(url);
          console.log("Service worker installed: ", url);
        } catch (e) {
          const error = e instanceof Error ? e.message + "\n" + e.stack : e;
          console.error("Failed to cache %s. ", url, error);
        }
      }
      console.log("cache initialized. Caching URLS: " + ["", ...urlsToCache].join("\n	- "));
      return;
    }).then((cache) => {
      console.log("Did cache");
    }).catch((e) => {
      const error = e instanceof Error ? e.message + "\n" + e.stack : e;
      console.error("Failed to cache all URLS. ", error);
    })
  );
});
self.addEventListener("activate", (event) => {
  console.log("Service worker activate event!");
});
self.addEventListener("fetch", async (event) => {
  console.log("onFetch", event);
  const request = event.request;
  if (!isCacheableRequest(request)) {
    console.log("Not caching resource: " + request.url);
    return fetch(request);
  }
  return getCachedOrFetch(CACHE_NAME, request);
});
