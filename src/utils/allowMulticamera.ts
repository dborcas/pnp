
let manual: Nullable<boolean> = null;

let _multiCameraAllowed: Nullable<boolean> = null

const hasQueryParameter = (part: Nullable<string>) => {
    return part != null && part.trim() != "" && /(^multicamera|&multicamera)($|=true|&)/gi.test(part.trim())
}

const hasMultiCameraQueryParameter = () => {
    if (hasQueryParameter(window.location.href.split("?")[1] ?? "")) {
        return true;
    }
    return hasQueryParameter(window.location.hash.split("#").pop());

}

window.addEventListener("hashchange", () => {
    _multiCameraAllowed = null;
})

export const setMultiCameraAllowed = (allowed: boolean) => {
    manual = allowed
}

export const isMultiCameraAllowed = (): boolean => {
    if (manual != null) {
        return manual;
    }
    _multiCameraAllowed ??= document.body.getAttribute("data-multicamera") === "true" || hasMultiCameraQueryParameter()
    return _multiCameraAllowed;
};