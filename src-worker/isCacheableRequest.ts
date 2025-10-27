
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
]


const isCacheableDomain = (url: string) => {
    if (url.includes("fonts.gstatic.com")) {
        return true;
    }

    if (url.includes("fonts.googleapis.com")) {
        return true;
    }
    return false;
}

export const isCacheableRequest = (request: Request) => {
    const url = request.url.toLowerCase();
    if (url.includes("worker.js")) {
        return false;
    }
    const extension = url.split("?")[0].split('.').pop().trim().toLowerCase();
    if (extension === "") {
        return true;
    }
    return cacheableExtensions.includes(extension) || isCacheableDomain(url);
}