import { CameraView } from "../camera-view/CameraView.tsx";
import { onErrorToast } from "../error/onerror.ts";
import Markup from "./Markup.tsx";
import "./MarkupCamera.css";
import type { CSSProperties } from "react";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";

export type MarkupCameraProps = {
  mainCamera: Nullable<DeviceInfo>;
  setMainCamera: (camera: DeviceInfo) => void;
  hasMainCamera: boolean;
  showToolbars: boolean;
  drawingEnabled: boolean;
  setDrawingEnabled: (enabled: boolean) => void;
  canvasId: string;
  onControlsPointerEnter?: () => void;
  onControlsPointerLeave?: () => void;
};

const MAX_ZOOM = 10;
const DEFAULT_STROKE_COLOR = "#FF0000";
const DEFAULT_STROKE_WIDTH = 2;
const MAX_STROKE_WIDTH = 12;
const ROTATION_STORAGE_KEY = "pnp.camera.rotation";

type CameraLayout = {
  width: number;
  height: number;
  visualWidth: number;
  visualHeight: number;
};

const getCachedStrokeWidth = (): number | null => {
  const cachedStrokeWidthString = localStorage.getItem("pnp.stroke.width");
  if (
    cachedStrokeWidthString == null ||
    cachedStrokeWidthString.trim() === ""
  ) {
    return null;
  }
  try {
    return parseInt(cachedStrokeWidthString, 10);
  } catch {
    return null;
  }
};

const getCachedRotation = (): number => {
  const cachedRotationString = localStorage.getItem(ROTATION_STORAGE_KEY);
  if (cachedRotationString == null || cachedRotationString.trim() === "") {
    return 0;
  }

  const cachedRotation = parseInt(cachedRotationString, 10);
  if (Number.isNaN(cachedRotation)) {
    return 0;
  }

  return ((cachedRotation % 360) + 360) % 360;
};

const getCameraLayout = (props: {
  viewportWidth: number;
  viewportHeight: number;
  aspectRatio: number;
  rotation: number;
}): CameraLayout => {
  const { viewportWidth, viewportHeight, aspectRatio, rotation } = props;
  const isQuarterTurn = rotation % 180 !== 0;
  const availableWidth = isQuarterTurn ? viewportHeight : viewportWidth;
  const availableHeight = isQuarterTurn ? viewportWidth : viewportHeight;

  let cameraWidth: number;
  let cameraHeight: number;
  if (availableWidth / availableHeight >= aspectRatio) {
    cameraHeight = availableHeight;
    cameraWidth = cameraHeight * aspectRatio;
  } else {
    cameraWidth = availableWidth;
    cameraHeight = cameraWidth / aspectRatio;
  }

  return {
    width: cameraWidth,
    height: cameraHeight,
    visualWidth: isQuarterTurn ? cameraHeight : cameraWidth,
    visualHeight: isQuarterTurn ? cameraWidth : cameraHeight,
  };
};

export function MarkupCamera(props: MarkupCameraProps) {
  const width = window.innerWidth;
  const height = window.innerHeight;
  const [strokeColor, _setStrokeColor] = useState(
    localStorage.getItem("pnp.stroke.color") ?? DEFAULT_STROKE_COLOR,
  );
  const [strokeWidth, _setStrokeWidth] = useState(
    getCachedStrokeWidth() ?? DEFAULT_STROKE_WIDTH,
  );
  const [_zoom, _setZoom] = useState(1.0);
  const [rotation, setRotation] = useState(getCachedRotation);
  const [scrollAreaStyle, setScrollAreaStyle] = useState<CSSProperties>({});
  const [cameraStyle, setCameraStyle] = useState<CSSProperties>({});
  const [markupSize, setMarkupSize] = useState<Size>({ width, height });
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

  const setStrokeWidth = useCallback(
    (width: number) => {
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
    },
    [strokeWidth],
  );

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

  const rotateCamera = useCallback((direction: "left" | "right") => {
    setRotation((currentRotation) => {
      const nextRotation = currentRotation + (direction === "left" ? -90 : 90);
      const normalizedRotation = ((nextRotation % 360) + 360) % 360;
      localStorage.setItem(ROTATION_STORAGE_KEY, normalizedRotation.toString());
      return normalizedRotation;
    });
  }, []);

  const clearCanvas = useCallback(() => {
    window.dispatchEvent(
      new CustomEvent("ClearCanvas", {
        bubbles: true,
        detail: { id: props.canvasId },
      }),
    );
  }, [props.canvasId]);

  useLayoutEffect(() => {
    const nextScrollAreaStyle: CSSProperties = {};
    const nextCameraStyle: CSSProperties = {};
    const container = containerRef.current;
    if (container == null) {
      setScrollAreaStyle({});
      setCameraStyle({});
      return;
    }

    const layout = getCameraLayout({
      viewportWidth: width,
      viewportHeight: height,
      aspectRatio,
      rotation,
    });
    const zoom = 1 + _zoom / 5;
    const scaledWidth = zoom * layout.visualWidth;
    const scaledHeight = zoom * layout.visualHeight;
    const scrollWidth = Math.max(width, scaledWidth);
    const scrollHeight = Math.max(height, scaledHeight);

    nextScrollAreaStyle.width = `${scrollWidth.toString()}px`;
    nextScrollAreaStyle.height = `${scrollHeight.toString()}px`;
    nextCameraStyle.width = `${layout.width.toString()}px`;
    nextCameraStyle.height = `${layout.height.toString()}px`;
    nextCameraStyle.left = `${((scrollWidth - layout.width) / 2).toString()}px`;
    nextCameraStyle.top = `${((scrollHeight - layout.height) / 2).toString()}px`;
    nextCameraStyle.transform = `rotate(${rotation.toString()}deg) scale(${zoom.toString()})`;

    setMarkupSize({
      width: Math.round(layout.width),
      height: Math.round(layout.height),
    });
    setScrollAreaStyle(nextScrollAreaStyle);
    setCameraStyle(nextCameraStyle);
  }, [_zoom, width, height, aspectRatio, rotation]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const ran = () => {
        e.preventDefault();
      };
      if (
        (e.shiftKey && e.key === "c") ||
        (!e.ctrlKey && !e.metaKey && e.key === "C")
      ) {
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
        } else if (e.key === "ArrowLeft" || e.key.toLowerCase() === "l") {
          ran();
          rotateCamera("left");
        } else if (e.key === "ArrowRight" || e.key.toLowerCase() === "r") {
          ran();
          rotateCamera("right");
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
        setZoom(_zoom - 1);
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
  }, [
    setStrokeWidth,
    _zoom,
    strokeWidth,
    setDrawingEnabled,
    drawingEnabled,
    clearCanvas,
    rotateCamera,
  ]);

  const toolbar = (
    <div
      className={`markup-camera-toolbar ${showToolbars ? "" : "hidden"}`}
      onPointerEnter={props.onControlsPointerEnter}
      onPointerLeave={props.onControlsPointerLeave}
    >
      <label className="inline-input-field rotate-control">
        <span>Rotate</span>
        <button
          className="icon-button app-icon-button"
          aria-label="rotate camera left"
          onClick={() => {
            rotateCamera("left");
          }}
        >
          <span className="material-symbols-outlined button-icon">
            rotate_left
          </span>
        </button>
        <button
          className="icon-button app-icon-button"
          aria-label="rotate camera right"
          onClick={() => {
            rotateCamera("right");
          }}
        >
          <span className="material-symbols-outlined button-icon">
            rotate_right
          </span>
        </button>
      </label>

      <label
        className={`inline-input-field color-control ${drawingEnabled ? "" : "display-hidden"}`}
      >
        <button onClick={clearCanvas}>
          <span className="material-symbols-outlined">edit_off</span>
        </button>
      </label>
      <label
        className={`inline-input-field stroke-width-control ${drawingEnabled ? "" : "display-hidden"}`}
      >
        <span>Thickness: </span>
        <input
          type="range"
          min="2"
          max={MAX_STROKE_WIDTH}
          value={strokeWidth}
          onChange={(e) => {
            setStrokeWidth(parseInt(e.target.value, 10));
          }}
        />
      </label>
      <label
        className={`inline-input-field color-control ${drawingEnabled ? "" : "display-hidden"}`}
      >
        <span>Color</span>
        <div className="color-container">
          <input
            type="color"
            value={strokeColor}
            ref={colorButtonRef}
            onChange={(e) => {
              setStrokeColor(e.target.value);
            }}
          />
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
        <input
          className="zoom-slider"
          type="range"
          min={0}
          max={MAX_ZOOM}
          value={_zoom}
          onChange={(e) => {
            setZoom(parseInt(e.target.value, 10));
          }}
        />
        <button
          className="zoom-button"
          aria-label={"zoom in"}
          onClick={() => {
            setZoom(_zoom + 1);
          }}
          disabled={_zoom >= MAX_ZOOM}
        >
          <span className="material-symbols-outlined">add</span>
        </button>
      </label>
    </div>
  );

  return (
    <div className="markup-camera-container toolbar-vert">
      {toolbar}
      <div
        className="markup-camera-scroll-area"
        data-testid="markup-camera-scroll-area"
        style={scrollAreaStyle}
        ref={containerRef}
      >
        <div
          className="markup-camera"
          data-testid="markup-camera-surface"
          style={cameraStyle}
        >
          <CameraView
            camera={mainCamera}
            kind={"main"}
            onError={onErrorToast}
            onCameraChange={setMainCamera}
            isFallbackCamera={!hasMainCamera}
            setCameraAspectRatio={setAspectRatio}
          />
          <Markup
            size={markupSize}
            strokeColor={strokeColor}
            strokeWidth={strokeWidth}
            enabled={props.drawingEnabled}
            brushScale={1 / (1 + _zoom / 10.0)}
            canvasId={props.canvasId}
            rotation={rotation}
            cssZoom={1 + _zoom / 5}
          />
        </div>
      </div>
    </div>
  );
}
