
export default function isInWorkerContext() {
    return (typeof WorkerGlobalScope !== "undefined" && self instanceof WorkerGlobalScope);
}