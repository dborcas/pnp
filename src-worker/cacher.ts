import type { ExtendableEvent } from "./types";

export default function beginCaching() {
    const CACHE_NAME = 'pnp-web-cache';
    const urlsToCache = [
        '/',
        '/index.html',
        '/assets/index.js', // Your main JavaScript file
        '/assets/index.css',
        '/assets/worker.js',
        '/assets/toastify.min.css',
    ];

    self.addEventListener('install', (event: ExtendableEvent) => {
        event.waitUntil(
            caches.open(CACHE_NAME)
                .then(cache => {
                    return cache.addAll(urlsToCache);
                })
        );
    });

    self.addEventListener("fetch", async (event: ExtendableEvent) => {
        event.respondWith(
            caches.match(event.request)
                .then((response) => {
                    if (response) {
                        return response;
                    }
                    return fetch(event.request)
                        .then((networkResponse) => {
                            return caches.open(CACHE_NAME)
                                .then((cache) => {
                                    cache.put(event.request, networkResponse.clone());
                                    return networkResponse;
                                });
                        });
                })
        );
    });
}