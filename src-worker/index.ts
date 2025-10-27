import type { ExtendableEvent } from "./types";
import { isCacheableRequest } from "./isCacheableRequest";
import { getCachedOrFetch } from "./fetchCached";

const CACHE_NAME = "pnp-web-cache";
const urlsToCache = [
    "/",
    "index.html",
    "/index.html",
    "assets/index.js", // Your main JavaScript file
    "assets/index.css",
    "assets/toastify.min.css",
    "doc-cam-apple-touch-icon.png",
    "favicon.ico",
    "site.webmanifest",
    "https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&icon_names=cached,cameraswitch,close,no_photography,photo_camera,visibility,visibility_off"
];

console.log("Loading service worker");

self.addEventListener("install", (event: ExtendableEvent) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(async (cache) => {
                for (const url of urlsToCache) {
                    console.log("Caching URL: ", url);
                    try {
                        await cache.add(url);
                        console.log("Service worker installed: ", url);
                    } catch (e) {
                        const error = e instanceof Error ? (e.message + "\n" + e.stack) : e;
                        console.error("Failed to cache %s. ", url, error);
                    }
                }
                console.log("cache initialized. Caching URLS: " + ["", ...urlsToCache].join("\n\t- "));
                return
            })
            .then(cache => {
                console.log("Did cache");
            })
            .catch((e: unknown) => {
                const error = e instanceof Error ? (e.message + "\n" + e.stack) : e;
                console.error("Failed to cache all URLS. ", error);
            })
    );
});


self.addEventListener("activate", (event) => {
    console.log("Service worker activate event!");
});

self.addEventListener("fetch", async (event: ExtendableEvent) => {
    console.log("onFetch", event);
    const request = event.request;
    if (!isCacheableRequest(request)) {
        console.log("Not caching resource: " + request.url);
        return fetch(request);
    }
    return getCachedOrFetch(CACHE_NAME, request);
});