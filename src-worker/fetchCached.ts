export const getCachedOrFetch = async (
    cacheName: string,
    request: Request,
) => {
    let response = await caches.match(request);
    console.log("Checking cache for: " + request.url);
    if (response && response.status >= 200 && response.status < 300) {
        console.log("Found cached response for: " + request.url);
        return response;
    }
    response = await fetch(request);
    if (response.status < 200 && response.status >= 300) {

    }
    console.log("fetched response for: " + request.url);
    const cache = await caches.open(cacheName);
    await cache.put(request, response);
    console.log("Put in cache:" + request.url);
    return response;
};