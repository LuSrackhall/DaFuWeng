import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Rnd } from "react-rnd";
import type { FloatingSurfaceDragPreferences } from "./floatingSurfaceDrag";
import { useThirdPartyLongPressDrag } from "./floatingSurfaceDrag";

const FLOATING_BOARD_STORAGE_KEY = "dafuweng-floating-board-frame-v3";
const BOARD_MIN_WIDTH = 520;
const BOARD_MIN_HEIGHT = 420;
const BOARD_RESIZE_STEP = 1;

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
  dragPreferences: FloatingSurfaceDragPreferences;
  onDragPreferencesChange: (updater: (prev: FloatingSurfaceDragPreferences) => FloatingSurfaceDragPreferences) => void;
  toolbar: ReactNode;
  children: ReactNode;
  isFocused: boolean;
  zIndex: number;
  onFocus: () => void;
};

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

export function FloatingBoardWindow({
  initialFrame,
  viewportSize,
  dragPreferences,
  onDragPreferencesChange,
  toolbar,
  children,
  isFocused,
  zIndex,
  onFocus,
}: FloatingBoardWindowProps) {
  const [frame, setFrame] = useState(() => readPersistedFrame(viewportSize, initialFrame));
  const [isInteracting, setIsInteracting] = useState(false);
  const [isDetailsCollapsed, setIsDetailsCollapsed] = useState(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const rndRef = useRef<Rnd | null>(null);
  const surfaceRef = useRef<HTMLDivElement | null>(null);

  const dockFrameRef = useRef(normalizeFrame(initialFrame));
  useEffect(() => {
    dockFrameRef.current = normalizeFrame(initialFrame);
  }, [initialFrame]);

  useThirdPartyLongPressDrag({
    enabled: true,
    surfaceRef,
    rndRef,
    frame,
    onFocus,
    onInteractingChange: setIsInteracting,
    onCommit: (nextFrame) => {
      setFrame(nextFrame);
      persistFrame(nextFrame);
    },
    holdDelayMs: dragPreferences.holdDelayMs,
  });

  function blurElementOnNextFrame(element: HTMLButtonElement | HTMLSelectElement) {
    if (typeof window === "undefined") {
      element.blur();
      return;
    }

    element.blur();
    window.setTimeout(() => element.blur(), 0);
    window.requestAnimationFrame(() => element.blur());
  }

  useEffect(() => {
    if (typeof window === "undefined" || typeof document === "undefined") {
      return;
    }

    const dismissActiveSelect = (event: Event) => {
      const activeElement = document.activeElement;
      if (!(activeElement instanceof HTMLSelectElement)) {
        return;
      }

      if (!surfaceRef.current?.contains(activeElement)) {
        return;
      }

      const target = event.target;
      if (target instanceof Node && activeElement.contains(target)) {
        return;
      }

      activeElement.blur();
    };

    window.addEventListener("pointerdown", dismissActiveSelect, true);
    window.addEventListener("click", dismissActiveSelect, true);
    return () => {
      window.removeEventListener("pointerdown", dismissActiveSelect, true);
      window.removeEventListener("click", dismissActiveSelect, true);
    };
  }, []);

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
      disableDragging={true}
      enableUserSelectHack={true}
      enableResizing={{
        top: true, right: true, bottom: true, left: true,
        topRight: true, bottomRight: true, bottomLeft: true, topLeft: true,
      }}
      resizeHandleClasses={{
        top: "board-window-resize-handle board-window-resize-handle--top",
        right: "board-window-resize-handle board-window-resize-handle--right",
        bottom: "board-window-resize-handle board-window-resize-handle--bottom",
        left: "board-window-resize-handle board-window-resize-handle--left",
        topRight: "board-window-resize-handle board-window-resize-handle--top-right",
        bottomRight: "board-window-resize-handle board-window-resize-handle--bottom-right",
        bottomLeft: "board-window-resize-handle board-window-resize-handle--bottom-left",
        topLeft: "board-window-resize-handle board-window-resize-handle--top-left",
      }}
      resizeGrid={[BOARD_RESIZE_STEP, BOARD_RESIZE_STEP]}
      dragGrid={[1, 1]}
      minWidth={BOARD_MIN_WIDTH}
      minHeight={BOARD_MIN_HEIGHT}
      default={{ x: frame.x, y: frame.y, width: frame.width, height: frame.height }}
      onMouseDown={onFocus}
      onTouchStart={onFocus}
      onResizeStart={() => {
        onFocus();
        setIsInteracting(true);
      }}
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
      <div ref={surfaceRef} className={`board-window${isDetailsCollapsed ? " board-window--details-collapsed" : ""}${isSettingsOpen ? " board-window--settings-open" : ""}`} data-testid="board-window-surface" data-focused={isFocused ? "true" : "false"}>
        <div className="board__hero board-window__toolbar board-drag-handle" data-testid="board-window-handle">
          <div className="board-window__toolbar-title" data-testid="board-window-drag-hotspot">
            <p className="shell__eyebrow">棋盘工作台</p>
            {!isDetailsCollapsed ? <strong>自由拖拽与八向缩放</strong> : null}
          </div>
          {!isDetailsCollapsed ? <div className="board-window__toolbar-content">{toolbar}</div> : null}
          <div className="board-window__toolbar-actions">
            <button
              className="floating-surface__action"
              data-testid="board-window-settings-toggle"
              type="button"
              onPointerDown={(event) => event.stopPropagation()}
              onClick={(event) => {
                event.stopPropagation();
                setIsSettingsOpen((current) => !current);
                blurElementOnNextFrame(event.currentTarget);
              }}
            >
              {isSettingsOpen ? "收起设置" : "设置"}
            </button>
            <button
              className="floating-surface__action"
              data-testid="board-window-toggle-details"
              type="button"
              onPointerDown={(event) => event.stopPropagation()}
              onClick={() => setIsDetailsCollapsed((current) => !current)}
            >
              {isDetailsCollapsed ? "展开信息" : "收起信息"}
            </button>
            <button className="floating-surface__action" data-testid="board-window-reset" type="button" onPointerDown={(event) => event.stopPropagation()} onClick={() => resetToDock()}>
              重置停靠位
            </button>
            <button className="floating-surface__action" data-testid="board-window-bring-front" type="button" onPointerDown={(event) => event.stopPropagation()} onClick={() => onFocus()}>
              置顶
            </button>
          </div>
        </div>
        {isSettingsOpen ? (
          <div className="board-window__settings" data-testid="board-window-settings">
            <label className="board-window__field">
              <strong>拖拽方案</strong>
              <select
                data-testid="board-window-drag-mode"
                value={dragPreferences.dragMode}
                onChange={(event) => {
                  const nextValue = event.target.value as FloatingSurfaceDragPreferences["dragMode"];
                  onDragPreferencesChange((current) => ({
                    ...current,
                    dragMode: nextValue,
                  }));
                  blurElementOnNextFrame(event.currentTarget);
                }}
              >
                <option value="third-party-hold">第三方库整窗长按拖拽</option>
                <option value="native">原生整窗长按拖拽</option>
              </select>
            </label>
          </div>
        ) : null}
        <div className="board-window__canvas" style={{ pointerEvents: isInteracting ? "none" : "auto" }}>
          {children}
        </div>
      </div>
    </Rnd>,
    document.body,
  );
}
