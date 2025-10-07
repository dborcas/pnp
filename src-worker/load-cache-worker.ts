
export default function loadCacheWorker() {
    if ("serviceWorker" in navigator) {
        window.addEventListener("load", () => {
            navigator.serviceWorker.register("assets/worker.js")
                .then(registration => {
                    console.log("Service Worker registered with scope:", registration.scope);
                })
                .catch((error: unknown) => {
                    console.error("Service Worker registration failed:", error);
                });
        });
    } else {
        console.error("Service Worker registration failed");
    }
}