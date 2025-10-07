export declare type ExtendableEvent =  Event & {
    waitUntil(await: Promise<unknown>): void
    respondWith(await: Promise<unknown>): void;
    readonly request: Request;
}