import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Rnd } from "react-rnd";

const FLOATING_BOARD_STORAGE_KEY = "dafuweng-floating-board-frame-v2";
const BOARD_MARGIN = 18;
const BOARD_TOP_OFFSET = 96;
const BOARD_MIN_WIDTH = 520;
const BOARD_MIN_HEIGHT = 420;
const BOARD_MAX_WIDTH_PADDING = 36;
const BOARD_MAX_HEIGHT_PADDING = 114;

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
};

function renderResizeHandle(prefix: string, direction: string) {
  return <span className={`floating-resize-handle floating-resize-handle--${direction}`} data-testid={`${prefix}-resize-${direction}`} />;
}

function clampFrame(frame: FloatingFrame, viewportSize: ViewportSize): FloatingFrame {
  const width = Math.min(Math.max(frame.width, BOARD_MIN_WIDTH), Math.max(BOARD_MIN_WIDTH, viewportSize.width - BOARD_MARGIN * 2));
  const height = Math.min(Math.max(frame.height, BOARD_MIN_HEIGHT), Math.max(BOARD_MIN_HEIGHT, viewportSize.height - BOARD_TOP_OFFSET - BOARD_MARGIN));

  return {
    x: Math.min(Math.max(frame.x, BOARD_MARGIN), Math.max(BOARD_MARGIN, viewportSize.width - width - BOARD_MARGIN)),
    y: Math.min(Math.max(frame.y, BOARD_TOP_OFFSET), Math.max(BOARD_TOP_OFFSET, viewportSize.height - height - BOARD_MARGIN)),
    width,
    height,
  };
}

function readPersistedFrame(viewportSize: ViewportSize) {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(FLOATING_BOARD_STORAGE_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as Partial<FloatingFrame>;
    if (
      typeof parsed.x !== "number"
      || typeof parsed.y !== "number"
      || typeof parsed.width !== "number"
      || typeof parsed.height !== "number"
    ) {
      return null;
    }

    return clampFrame(parsed as FloatingFrame, viewportSize);
  } catch {
    return null;
  }
}

function persistFrame(frame: FloatingFrame) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(FLOATING_BOARD_STORAGE_KEY, JSON.stringify(frame));
}

export function FloatingBoardWindow({ initialFrame, viewportSize, toolbar, children }: FloatingBoardWindowProps) {
  const [frame, setFrame] = useState(() => readPersistedFrame(viewportSize) ?? clampFrame(initialFrame, viewportSize));
  const [isInteracting, setIsInteracting] = useState(false);
  const rndRef = useRef<Rnd | null>(null);

  useEffect(() => {
    setFrame((current) => {
      const nextFrame = clampFrame(current, viewportSize);
      rndRef.current?.updateSize({ width: nextFrame.width, height: nextFrame.height });
      rndRef.current?.updatePosition({ x: nextFrame.x, y: nextFrame.y });
      persistFrame(nextFrame);
      return nextFrame;
    });
  }, [viewportSize.height, viewportSize.width]);

  useEffect(() => {
    setFrame((current) => {
      const nextFrame = current.width > 0 && current.height > 0
        ? clampFrame(current, viewportSize)
        : readPersistedFrame(viewportSize) ?? clampFrame(initialFrame, viewportSize);
      rndRef.current?.updateSize({ width: nextFrame.width, height: nextFrame.height });
      rndRef.current?.updatePosition({ x: nextFrame.x, y: nextFrame.y });
      persistFrame(nextFrame);
      return nextFrame;
    });
  }, [initialFrame.height, initialFrame.width, initialFrame.x, initialFrame.y, viewportSize]);

  if (typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <Rnd
      ref={rndRef}
      bounds="window"
      data-testid="floating-board-window"
      className={`board-resizable-wrap${isInteracting ? " board-resizable-wrap--interacting" : ""}`}
      dragHandleClassName="board-drag-handle"
      enableUserSelectHack={false}
      enableResizing={{
        top: true,
        right: true,
        bottom: true,
        left: true,
        topRight: true,
        bottomRight: true,
        bottomLeft: true,
        topLeft: true,
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
      resizeGrid={[12, 12]}
      dragGrid={[1, 1]}
      minWidth={BOARD_MIN_WIDTH}
      minHeight={BOARD_MIN_HEIGHT}
      maxWidth={Math.max(BOARD_MIN_WIDTH, viewportSize.width - BOARD_MAX_WIDTH_PADDING)}
      maxHeight={Math.max(BOARD_MIN_HEIGHT, viewportSize.height - BOARD_MAX_HEIGHT_PADDING)}
      default={{ x: frame.x, y: frame.y, width: frame.width, height: frame.height }}
      onDragStart={() => {
        setIsInteracting(true);
      }}
      onDragStop={(_event, data) => {
        setFrame((current) => {
          const nextFrame = clampFrame({ ...current, x: data.x, y: data.y }, viewportSize);
          persistFrame(nextFrame);
          return nextFrame;
        });
        setIsInteracting(false);
      }}
      onResizeStart={() => {
        setIsInteracting(true);
      }}
      onResizeStop={(_event, _direction, ref, _delta, position) => {
        const nextFrame = clampFrame({
          x: position.x,
          y: position.y,
          width: ref.offsetWidth,
          height: ref.offsetHeight,
        }, viewportSize);
        setFrame(nextFrame);
        persistFrame(nextFrame);
        setIsInteracting(false);
      }}
      style={{ position: "fixed", zIndex: 5 }}
    >
      <div className="board-window" data-testid="board-window-surface">
        <div className="board__hero board-window__toolbar board-drag-handle" data-testid="board-window-handle">
          {toolbar}
        </div>
        <div className="board-window__canvas">{children}</div>
      </div>
    </Rnd>,
    document.body,
  );
}
