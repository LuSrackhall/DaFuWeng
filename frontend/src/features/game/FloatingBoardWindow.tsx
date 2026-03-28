import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Rnd } from "react-rnd";

const FLOATING_BOARD_STORAGE_KEY = "dafuweng-floating-board-frame-v3";
const BOARD_MIN_WIDTH = 520;
const BOARD_MIN_HEIGHT = 420;
const BOARD_RESIZE_STEP = 12;

type FloatingFrame = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type ViewportSize = {
  width: number;
  height: number;
};

type FloatingBoardWindowProps = {
  initialFrame: FloatingFrame;
  viewportSize: ViewportSize;
  toolbar: ReactNode;
  children: ReactNode;
  isFocused: boolean;
  zIndex: number;
  onFocus: () => void;
};

function renderResizeHandle(prefix: string, direction: string) {
  return <span className={`floating-resize-handle floating-resize-handle--${direction}`} data-testid={`${prefix}-resize-${direction}`} />;
}

function normalizeFrame(frame: FloatingFrame): FloatingFrame {
  return {
    x: Number.isFinite(frame.x) ? frame.x : 0,
    y: Number.isFinite(frame.y) ? frame.y : 0,
    width: Math.max(frame.width || BOARD_MIN_WIDTH, BOARD_MIN_WIDTH),
    height: Math.max(frame.height || BOARD_MIN_HEIGHT, BOARD_MIN_HEIGHT),
  };
}

function readPersistedFrame(viewportSize: ViewportSize, initialFrame: FloatingFrame): FloatingFrame {
  if (typeof window === "undefined") {
    return normalizeFrame(initialFrame);
  }

  try {
    const raw = window.localStorage.getItem(FLOATING_BOARD_STORAGE_KEY);
    if (!raw) {
      return normalizeFrame(initialFrame);
    }

    const parsed = JSON.parse(raw) as Partial<FloatingFrame>;
    if (
      typeof parsed.x !== "number" ||
      typeof parsed.y !== "number" ||
      typeof parsed.width !== "number" ||
      typeof parsed.height !== "number"
    ) {
      return normalizeFrame(initialFrame);
    }

    return normalizeFrame(parsed as FloatingFrame);
  } catch {
    return normalizeFrame(initialFrame);
  }
}

function persistFrame(frame: FloatingFrame) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(FLOATING_BOARD_STORAGE_KEY, JSON.stringify(frame));
}

export function FloatingBoardWindow({ initialFrame, viewportSize, toolbar, children, isFocused, zIndex, onFocus }: FloatingBoardWindowProps) {
  const [frame, setFrame] = useState(() => readPersistedFrame(viewportSize, initialFrame));
  const [isInteracting, setIsInteracting] = useState(false);
  const rndRef = useRef<Rnd | null>(null);

  const dockFrameRef = useRef(normalizeFrame(initialFrame));
  useEffect(() => {
    dockFrameRef.current = normalizeFrame(initialFrame);
  }, [initialFrame]);

  function resetToDock() {
    const nextFrame = normalizeFrame(dockFrameRef.current);
    setFrame(nextFrame);
    persistFrame(nextFrame);
    rndRef.current?.updateSize({ width: nextFrame.width, height: nextFrame.height });
    rndRef.current?.updatePosition({ x: nextFrame.x, y: nextFrame.y });
  }

  if (typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <Rnd
      ref={rndRef}
      data-testid="floating-board-window"
      className={`board-resizable-wrap${isFocused ? " board-resizable-wrap--focused" : ""}${isInteracting ? " board-resizable-wrap--interacting" : ""}`}
      dragHandleClassName="board-drag-handle"
      enableUserSelectHack={false}
      enableResizing={{
        top: true, right: true, bottom: true, left: true,
        topRight: true, bottomRight: true, bottomLeft: true, topLeft: true,
      }}
      resizeHandleComponent={{
        top: renderResizeHandle("board-window", "top"),
        right: renderResizeHandle("board-window", "right"),
        bottom: renderResizeHandle("board-window", "bottom"),
        left: renderResizeHandle("board-window", "left"),
        topRight: renderResizeHandle("board-window", "top-right"),
        bottomRight: renderResizeHandle("board-window", "bottom-right"),
        bottomLeft: renderResizeHandle("board-window", "bottom-left"),
        topLeft: renderResizeHandle("board-window", "top-left"),
      }}
      resizeGrid={[BOARD_RESIZE_STEP, BOARD_RESIZE_STEP]}
      dragGrid={[1, 1]}
      minWidth={BOARD_MIN_WIDTH}
      minHeight={BOARD_MIN_HEIGHT}
      default={{ x: frame.x, y: frame.y, width: frame.width, height: frame.height }}
      onMouseDown={onFocus}
      onTouchStart={onFocus}
      onDragStart={() => {
        onFocus();
        setIsInteracting(true);
      }}
      onDragStop={(_event, data) => {
        setIsInteracting(false);
        const nextFrame = normalizeFrame({ ...frame, x: data.x, y: data.y });
        setFrame(nextFrame);
        persistFrame(nextFrame);
      }}
      onResizeStart={() => setIsInteracting(true)}
      onResizeStop={(_event, _direction, ref, _delta, position) => {
        setIsInteracting(false);
        const nextFrame = normalizeFrame({
          x: position.x,
          y: position.y,
          width: ref.offsetWidth,
          height: ref.offsetHeight,
        });
        setFrame(nextFrame);
        persistFrame(nextFrame);
      }}
      style={{ position: "fixed", zIndex }}
      cancel="button, input, select, option"
    >
      <div className="board-window" data-testid="board-window-surface" data-focused={isFocused ? "true" : "false"}>
        <div className="board__hero board-window__toolbar board-drag-handle" data-testid="board-window-handle">
          <div className="board-window__toolbar-content">{toolbar}</div>
          <div className="board-window__toolbar-actions">
            <button className="floating-surface__action" data-testid="board-window-reset" type="button" onPointerDown={(event) => event.stopPropagation()} onClick={() => resetToDock()}>
              重置停靠位
            </button>
            <button className="floating-surface__action" data-testid="board-window-bring-front" type="button" onPointerDown={(event) => event.stopPropagation()} onClick={() => onFocus()}>
              置顶
            </button>
          </div>
        </div>
        <div className="board-window__canvas">
          {children}
          {isInteracting && <div className="board-window__interaction-shield" />}
        </div>
      </div>
    </Rnd>,
    document.body,
  );
}
