import loadCacheWorker from "./load-cache-worker";
import beginCaching from "./cacher";

if (typeof window !== "undefined") {
    loadCacheWorker()
} else {
    beginCaching()
}