import { useEffect, useRef, useState } from "react";
import { createUndoableCanvas } from "../canvas/UndoableCanvas.tsx";

export type MarkupProps = {
  size: Size;
  strokeColor?: Nullable<string>;
  strokeWidth?: Nullable<number>;
  enabled: boolean;
  brushScale?: number;
  canvasId: string;
  rotation?: number;
  cssZoom?: number;
};

export default function Markup(props: MarkupProps) {
  const canvas = useRef<HTMLCanvasElement | null>(null);
  const [undoableCanvas] = useState(createUndoableCanvas());
  const { width, height } = props.size;
  const {
    strokeColor: strokeColor,
    strokeWidth: strokeWidth,
    canvasId,
    enabled,
  } = props;
  const brushScale = props.brushScale ?? 1;
  if (strokeWidth != null || strokeColor != null) {
    undoableCanvas?.setStroke({ color: strokeColor, width: strokeWidth });
  }

  useEffect(() => {
    const undoCanvas = undoableCanvas;
    if (undoCanvas == null) {
      console.error("No undoable canvas created");
      return;
    }
    if (canvas.current == null) {
      console.error("No canvas for markup");
      return;
    }

    const unregister = undoCanvas.setCanvas(canvas.current);

    const clearCanvas = (e: Event) => {
      const targetId = (
        e as unknown as CustomEvent<Nullable<Partial<{ id?: string }>>>
      ).detail?.id;
      if (targetId != null && targetId !== canvasId) {
        return;
      }
      console.log("clearing UndoableCanvas");
      undoCanvas.clear();
      console.log("UndoableCanvas was cleared");
    };

    window.addEventListener("ClearCanvas", clearCanvas);
    return () => {
      unregister();
      window.removeEventListener("ClearCanvas", clearCanvas);
    };
  }, [undoableCanvas, canvasId, width, height]);

  useEffect(() => {
    const undoCanvas = undoableCanvas;
    if (undoCanvas == null) {
      return;
    }
    undoCanvas.setBrushScale(brushScale);
  }, [brushScale, undoableCanvas]);

  useEffect(() => {
    undoableCanvas?.setCoordTransform(props.rotation ?? 0, props.cssZoom ?? 1);
  }, [props.rotation, props.cssZoom, undoableCanvas]);

  useEffect(() => {
    const canvas = undoableCanvas;
    if (canvas == null) {
      console.error("No undoable canvas created");
      return;
    }
    canvas.setEnabled(enabled);
  }, [enabled, undoableCanvas]);

  useEffect(() => {
    if (undoableCanvas == null) {
      console.error("No undoable canvas created");
      return;
    }
    undoableCanvas.setStroke({ color: strokeColor, width: strokeWidth });
  }, [strokeColor, strokeWidth, undoableCanvas]);
  return (
    <>
      <canvas width={width} height={height} ref={canvas} />
    </>
  );
}
