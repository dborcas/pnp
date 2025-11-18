import { CameraView } from "../camera-view/CameraView.tsx";
import { onErrorToast } from "../error/onerror.ts";
import Markup from "./Markup.tsx";
import "./MarkupCamera.css";
import type { CSSProperties } from "react";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

export type MarkupCameraProps = {
    mainCamera: Nullable<DeviceInfo>;
    setMainCamera: (camera: DeviceInfo) => void;
    hasMainCamera: boolean;
    showToolbars: boolean;
    drawingEnabled: boolean;
    setDrawingEnabled: (enabled: boolean) => void;
    canvasId: string;
};

const MAX_ZOOM = 10;
const DEFAULT_STROKE_COLOR = "#FF0000";
const DEFAULT_STROKE_WIDTH = 2;
const MAX_STROKE_WIDTH = 12;


const getCachedStrokeWidth = (): number | null => {
    const cachedStrokeWidthString = localStorage.getItem("pnp.stroke.width");
    if (cachedStrokeWidthString == null || cachedStrokeWidthString.trim() === "") {
        return null;
    }
    try {
        return parseInt(cachedStrokeWidthString, 10);
    } catch {
        return null;
    }
};

export function MarkupCamera(props: MarkupCameraProps) {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const [strokeColor, _setStrokeColor] = useState(localStorage.getItem("pnp.stroke.color") ?? DEFAULT_STROKE_COLOR);
    const [strokeWidth, _setStrokeWidth] = useState(getCachedStrokeWidth() ?? DEFAULT_STROKE_WIDTH);
    const [_zoom, _setZoom] = useState(1.0);
    const [style, setStyle] = useState<CSSProperties>({});
    const [aspectRatio, setAspectRatio] = useState(width / height);
    const containerRef = useRef<HTMLDivElement | null>(null);
    const colorButtonRef = useRef<HTMLInputElement | null>(null);

    const {
        mainCamera,
        setMainCamera,
        hasMainCamera,
        showToolbars,
        drawingEnabled,
        setDrawingEnabled,
    } = props;

    const setStrokeWidth = useCallback((width: number) => {
        if (width < 0) {
            width = 0;
        } else if (width > MAX_STROKE_WIDTH) {
            width = MAX_STROKE_WIDTH;
        }
        if (width === strokeWidth) {
            return;
        }
        localStorage.setItem("pnp.stroke.width", width.toString());
        _setStrokeWidth(width);
    }, [strokeWidth]);

    const setStrokeColor = (color: string) => {
        localStorage.setItem("pnp.stroke.color", color);
        _setStrokeColor(color);
    };

    const setZoom = (zoom: number) => {
        if (zoom > MAX_ZOOM) {
            zoom = MAX_ZOOM;
        } else if (zoom < 0) {
            zoom = 0;
        }
        _setZoom(zoom);

    };

    const clearCanvas = useCallback(() => {
        window.dispatchEvent(new CustomEvent("ClearCanvas", { bubbles: true, detail: {id: props.canvasId} }));
    },[props.canvasId])

    useLayoutEffect(() => {
        const style: CSSProperties = {};
        if (_zoom === 0) {
            setStyle({});
            return;
        }
        const container = containerRef.current;
        if (container == null) {
            setStyle({});
            return;
        }

        let widthSized: number;
        let heightSized: number;
        if (width >= height) {
            widthSized = (height * aspectRatio);
            heightSized = height;
        } else {
            widthSized = width;
            heightSized = (width * aspectRatio);
        }
        style.width = `${(widthSized).toString()}px`;
        style.height = `${(heightSized).toString()}px`;


        const zoom = 1 + (_zoom / 5);
        style.transform = `scale(${zoom.toString()})`;
        const scaledWidth = zoom * (widthSized + 20);
        const offsetX = (scaledWidth - width) / 2;
        if (offsetX > 0) {
            style.marginLeft = offsetX.toString() + "px";
        }
        // Set Offset X
        const scaledHeight = zoom * heightSized;
        const offsetY = (scaledHeight - height) / 2;
        console.log({
            scaledHeight,
            height,
            offsetY
        });
        if (offsetY > 0) {
            style.marginTop = offsetY.toString() + "px";
        }

        setStyle(style);
    }, [_zoom, width, height, setStyle, aspectRatio, setAspectRatio]);


    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            const ran = () => {
                e.preventDefault();
            }
            if ((e.shiftKey && e.key === "c") || (!e.ctrlKey && !e.metaKey && e.key === "C")) {
                ran();
                clearCanvas();
            } else if (e.metaKey || e.ctrlKey) {
                if (e.key === "_" || e.key === "-") {
                    ran();
                    setZoom(_zoom - 1);
                } else if (e.key === "+" || e.key === "=") {
                    ran();
                    setZoom(_zoom + 1);
                } else if (e.key === "0") {
                    ran();
                    setZoom(0);
                }
            } else if (e.key === "[") {
                ran();
                setStrokeWidth(strokeWidth - 1);
            } else if (e.key === "]") {
                ran();
                setStrokeWidth(strokeWidth + 1);
            } else if (e.key === "c") {
                ran();
                const colorButton = colorButtonRef.current;
                if (colorButton == null) {
                    return;
                }
                colorButton.click();
            } else if (e.key === "p" || e.key === "P") {
                ran();
                setDrawingEnabled(!drawingEnabled);
            }
        };
        window.addEventListener("keydown", onKey);

        const onWheel = (e: WheelEvent) => {
              if (!e.altKey) {
                  return;
              }
              e.preventDefault();
              e.stopPropagation();
              e.stopImmediatePropagation();
              if (e.deltaY > 0) {
                  setZoom(_zoom - 1)
              } else if (e.deltaY < 0) {
                  setZoom(_zoom + 1);
              }
              return false;
        };

        window.addEventListener("wheel", onWheel);

        return () => {
            window.removeEventListener("keydown", onKey);
            window.removeEventListener("wheel", onWheel);
        };
    }, [setStrokeWidth, _zoom, strokeWidth, setDrawingEnabled, drawingEnabled, clearCanvas]);


    const toolbar = <div className={`markup-camera-toolbar ${(showToolbars && drawingEnabled) ? "" : "hidden"}`}>

        <label className="inline-input-field color-control">
            <button onClick={clearCanvas}><span className="material-symbols-outlined">edit_off</span></button>
        </label>
        <label className="inline-input-field stroke-width-control">
            <span>Thickness: </span>
            <input type="range" min="2" max={MAX_STROKE_WIDTH} value={strokeWidth} onChange={(e) => {
                setStrokeWidth(parseInt(e.target.value, 10));
            }}/>
        </label>
        <label className="inline-input-field color-control">
            <span>Color</span>
            <div className="color-container">
                <input type="color" value={strokeColor} ref={colorButtonRef} onChange={(e) => {
                    setStrokeColor(e.target.value);
                }}/>
            </div>
        </label>

        <label className="inline-input-field zoom-control">
            <span>Zoom</span>
            <button
                className="zoom-button"
                aria-label={"zoom out"}
                onClick={() => {
                    setZoom(_zoom - 1);
                }}
                disabled={_zoom <= 0}
            >
                <span className="material-symbols-outlined">remove</span>
            </button>
            <input className="zoom-slider" type="range" min={0} max={MAX_ZOOM} value={_zoom} onChange={(e) => {
                setZoom(parseInt(e.target.value, 10));
            }}/>
            <button
                className="zoom-button"
                aria-label={"zoom in"}
                onClick={() => {
                    setZoom(_zoom + 1);
                }}
                disabled={_zoom >= MAX_ZOOM}
            ><span className="material-symbols-outlined">add</span></button>
        </label>
    </div>;

    return <div className="markup-camera-container toolbar-vert">
        {toolbar}
        <div className="markup-camera" style={style} ref={containerRef}>
            <CameraView
                camera={mainCamera}
                kind={"main"}
                onError={onErrorToast}
                onCameraChange={setMainCamera}
                isFallbackCamera={!hasMainCamera}
                setCameraAspectRatio={setAspectRatio}
            />
            <Markup size={{width, height}} strokeColor={strokeColor} strokeWidth={strokeWidth}
                    enabled={props.drawingEnabled}
                    brushScale={1 / (1 + _zoom / 10.0)}
                    canvasId={props.canvasId}
            />
        </div>
    </div>;
}