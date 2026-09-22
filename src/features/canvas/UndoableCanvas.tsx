export type UndoableCanvas = {
  setCanvas(canvas: HTMLCanvasElement): () => void;
  setStroke(props: {
    color?: Nullable<string>;
    width?: Nullable<number>;
  }): void;
  undo(): void;
  redo(): void;
  canRedo(): boolean;
  canUndo(): boolean;
  clear(): void;
  setEnabled(enable?: boolean): void;
  setBrushScale(zoom: number): void;
};

type Movement = {
  x: number;
  y: number;
  color?: Nullable<string>;
  width?: Nullable<number>;
};

export type CanvasPointProps = {
  offsetX: number;
  offsetY: number;
};

const noOp = () => {
  //ignore
};

export const getCanvasPoint = (props: CanvasPointProps): Movement => {
  return {
    x: props.offsetX,
    y: props.offsetY,
  };
};

const getCanvasPointerPoint = (e: PointerEvent): Movement => {
  return getCanvasPoint({
    offsetX: e.offsetX,
    offsetY: e.offsetY,
  });
};

export function createUndoableCanvas(
  canvas?: HTMLCanvasElement,
): Nullable<UndoableCanvas> {
  let _ctx: Nullable<CanvasRenderingContext2D> = null;
  let _enabled = false;
  const enabled = () => _enabled && _ctx != null;
  let isDrawing = false;
  let activePointerId: Nullable<number> = null;
  let lastX = 0;
  let lastY = 0;
  let strokeColor = "#FF0000";
  let strokeWidth = 5;
  let canvasWidth = canvas?.width ?? 0;
  let canvasHeight = canvas?.height ?? 0;
  const undoStack: Movement[][] = [];
  const redoStack: Movement[][] = [];
  let currentPath: Movement[] = [];
  let unregisterCanvasListeners = noOp;
  let _brushScale = 1.0;

  const canvasPointerDown = (e: PointerEvent) => {
    if (!enabled()) {
      return;
    }

    e.preventDefault();
    const canvas = e.currentTarget as HTMLCanvasElement;
    const point = getCanvasPointerPoint(e);
    isDrawing = true;
    activePointerId = e.pointerId;
    canvas.setPointerCapture(e.pointerId);
    [lastX, lastY] = [point.x, point.y];
    redoStack.splice(0);
    currentPath = [
      {
        x: lastX,
        y: lastY,
        width: strokeWidth,
        color: strokeColor,
      },
    ]; // Start new path
  };

  const canvasPointerMove = (e: PointerEvent) => {
    if (!isDrawing || e.pointerId !== activePointerId) {
      return;
    }
    e.preventDefault();
    const ctx: Nullable<CanvasRenderingContext2D> = _ctx;
    if (ctx == null) {
      return;
    }
    _setStroke(ctx, {
      color: strokeColor,
      width: strokeWidth,
      x: 0,
      y: 0,
    } satisfies Movement);
    ctx.beginPath();
    ctx.moveTo(lastX, lastY);

    const point = getCanvasPointerPoint(e);
    [lastX, lastY] = [point.x, point.y];
    currentPath.push({
      x: lastX,
      y: lastY,
    }); // Add points to current path

    ctx.lineTo(lastX, lastY);
    ctx.stroke();
  };

  const canvasPointerUp = (e: PointerEvent) => {
    if (e.pointerId !== activePointerId) {
      return;
    }
    const canvas = e.currentTarget as HTMLCanvasElement;
    if (canvas.hasPointerCapture(e.pointerId)) {
      canvas.releasePointerCapture(e.pointerId);
    }
    isDrawing = false;
    activePointerId = null;
    if (currentPath.length === 0) {
      return;
    }
    undoStack.push(currentPath); // Save the completed path
    currentPath = []; // Reset for next path
  };

  const undo = () => {
    if (undoStack.length === 0) {
      return;
    }
    const last = undoStack.pop();
    if (last == null) {
      return;
    }
    redoStack.push(last); // Remove last path
    render(undoStack);
  };

  const redo = () => {
    if (redoStack.length === 0) {
      return;
    }
    const last = redoStack.pop();
    if (last == null) {
      return;
    }

    undoStack.push(last); // Add undone stoke to redo
    render(undoStack);
  };

  const canvasKeyDown = (e: KeyboardEvent) => {
    if (!e.metaKey && !e.ctrlKey) {
      return;
    }
    if (e.key === "Z" || (e.key == "z" && e.shiftKey)) {
      redo();
      return;
    }
    if (e.key === "z") {
      undo();
      return;
    }
  };

  const _setStroke = (ctx: CanvasRenderingContext2D, movement: Movement) => {
    const width = movement.width;
    const color = movement.color;

    if (color == null || width == null) {
      return;
    }

    ctx.strokeStyle = color;
    ctx.lineWidth = Math.max(width * _brushScale, 2);
  };

  const render = (stack: Movement[][]) => {
    const ctx: Nullable<CanvasRenderingContext2D> = _ctx;
    if (ctx == null) {
      return;
    }

    ctx.clearRect(0, 0, canvasWidth, canvasHeight); // Clear canvas
    ctx.fillStyle = "rgba(0,0,0,0)";
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    // Redraw all remaining paths in undoStack
    stack.forEach((path) => {
      if (path.length === 0) {
        return;
      }
      _setStroke(ctx, path[0]);
      ctx.beginPath();
      ctx.moveTo(path[0].x, path[0].y);
      for (let i = 1; i < path.length; i++) {
        const p = path[i];
        _setStroke(ctx, p);
        ctx.lineTo(p.x, p.y);
      }
      ctx.stroke();
    });
  };

  const setStroke = (props: { color?: string; width?: number }) => {
    strokeWidth = props.width ?? strokeWidth;
    strokeColor = props.color ?? strokeColor;
  };

  const registerCanvasListeners = (canvas: HTMLCanvasElement) => {
    canvas.addEventListener("pointerdown", canvasPointerDown);
    canvas.addEventListener("pointermove", canvasPointerMove);
    canvas.addEventListener("pointerup", canvasPointerUp);
    canvas.addEventListener("pointercancel", canvasPointerUp);
    window.addEventListener("keydown", canvasKeyDown);
    return () => {
      canvas.removeEventListener("pointerdown", canvasPointerDown);
      canvas.removeEventListener("pointermove", canvasPointerMove);
      canvas.removeEventListener("pointerup", canvasPointerUp);
      canvas.removeEventListener("pointercancel", canvasPointerUp);
      window.removeEventListener("keydown", canvasKeyDown);
    };
  };

  const setCanvas = (canvas: HTMLCanvasElement): (() => void) => {
    canvasWidth = canvas.width;
    canvasHeight = canvas.height;
    unregisterCanvasListeners();
    _ctx = canvas.getContext("2d");

    if (_ctx == null) {
      unregisterCanvasListeners = noOp;
      return noOp;
    }
    _ctx.lineCap = "round";
    const unregister = registerCanvasListeners(canvas);
    unregisterCanvasListeners = unregister;
    render(undoStack);
    return unregister;
  };

  const setEnabled = (enable: boolean): void => {
    _enabled = enable;
  };

  if (canvas) {
    setCanvas(canvas);
  }

  const clear = () => {
    console.log("clearing UndoableCanvas");
    redoStack.splice(0, redoStack.length);
    undoStack.splice(0, undoStack.length);
    console.log("cleared UndoableCanvas");
    render(undoStack);
  };

  return {
    undo,
    redo,
    setStroke,
    setCanvas,
    canRedo(): boolean {
      return undoStack.length > 0;
    },
    canUndo(): boolean {
      return redoStack.length > 0;
    },
    clear,
    setEnabled,
    setBrushScale(zoom: number): void {
      _brushScale = zoom;
      render(undoStack);
    },
  } satisfies UndoableCanvas;
}
