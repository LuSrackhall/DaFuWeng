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
const BOARD_SNAP_THRESHOLD = 26;
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

type SnapGuide = {
  axis: "x" | "y";
  value: number;
  label: string;
};

type FeedbackKind = "snap" | "reset";

function renderResizeHandle(prefix: string, direction: string) {
  return <span className={`floating-resize-handle floating-resize-handle--${direction}`} data-testid={`${prefix}-resize-${direction}`} />;
}

function normalizeFrame(frame: FloatingFrame): FloatingFrame {
  return {
    x: frame.x,
    y: frame.y,
    width: Math.max(frame.width, BOARD_MIN_WIDTH),
    height: Math.max(frame.height, BOARD_MIN_HEIGHT),
  };
}

function snapBoardFrame(frame: FloatingFrame, viewportSize: ViewportSize, dockFrame: FloatingFrame) {
  const nextFrame = { ...normalizeFrame(frame) };
  const guides: SnapGuide[] = [];
  const xTargets = [
    { value: BOARD_MARGIN, label: "吸附到左侧安全区" },
    { value: dockFrame.x, label: "吸附到默认停靠位" },
    { value: viewportSize.width - nextFrame.width - BOARD_MARGIN, label: "吸附到右侧安全区" },
  ];
  const yTargets = [
    { value: BOARD_TOP_OFFSET, label: "吸附到顶部安全区" },
    { value: dockFrame.y, label: "吸附到默认停靠位" },
  ];

  for (const target of xTargets) {
    if (Math.abs(nextFrame.x - target.value) <= BOARD_SNAP_THRESHOLD) {
      nextFrame.x = target.value;
      guides.push({ axis: "x", value: target.value, label: target.label });
      break;
    }
  }

  for (const target of yTargets) {
    if (Math.abs(nextFrame.y - target.value) <= BOARD_SNAP_THRESHOLD) {
      nextFrame.y = target.value;
      guides.push({ axis: "y", value: target.value, label: target.label });
      break;
    }
  }

  return { frame: nextFrame, guides };
}

function buildBoundaryHints(frame: FloatingFrame, viewportSize: ViewportSize) {
  const hints: string[] = [];
  if (frame.x < 0) {
    hints.push(`已越出左侧 ${Math.round(Math.abs(frame.x))} px`);
  }
  if (frame.y < 0) {
    hints.push(`已越出顶部 ${Math.round(Math.abs(frame.y))} px`);
  }
  if (frame.x + frame.width > viewportSize.width) {
    hints.push(`已越出右侧 ${Math.round(frame.x + frame.width - viewportSize.width)} px`);
  }
  if (frame.y + frame.height > viewportSize.height) {
    hints.push(`已越出底部 ${Math.round(frame.y + frame.height - viewportSize.height)} px`);
  }
  return hints;
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

    return snapBoardFrame(normalizeFrame(parsed as FloatingFrame), viewportSize, normalizeFrame(parsed as FloatingFrame)).frame;
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

export function FloatingBoardWindow({ initialFrame, viewportSize, toolbar, children, isFocused, zIndex, onFocus }: FloatingBoardWindowProps) {
  const [frame, setFrame] = useState(() => readPersistedFrame(viewportSize) ?? normalizeFrame(initialFrame));
  const [previewFrame, setPreviewFrame] = useState<FloatingFrame | null>(null);
  const [activeGuides, setActiveGuides] = useState<SnapGuide[]>([]);
  const [isInteracting, setIsInteracting] = useState(false);
  const [feedbackKind, setFeedbackKind] = useState<FeedbackKind | null>(null);
  const rndRef = useRef<Rnd | null>(null);
  const previewRafRef = useRef<number | null>(null);
  const feedbackTimeoutRef = useRef<number | null>(null);
  const dockFrameRef = useRef(normalizeFrame(initialFrame));

  const currentFrame = previewFrame ?? frame;
  const boundaryHints = buildBoundaryHints(currentFrame, viewportSize);
  const showRecoveryChip = !isInteracting && boundaryHints.length > 0;

  function triggerFeedback(nextKind: FeedbackKind) {
    if (feedbackTimeoutRef.current !== null) {
      window.clearTimeout(feedbackTimeoutRef.current);
    }

    setFeedbackKind(nextKind);
    feedbackTimeoutRef.current = window.setTimeout(() => {
      setFeedbackKind(null);
      feedbackTimeoutRef.current = null;
    }, 340);
  }

  function resetToDock() {
    const nextFrame = normalizeFrame(dockFrameRef.current);
    setFrame(nextFrame);
    setPreviewFrame(null);
    setActiveGuides([
      { axis: "x", value: nextFrame.x, label: "已重置到默认停靠位" },
      { axis: "y", value: nextFrame.y, label: "已重置到默认停靠位" },
    ]);
    persistFrame(nextFrame);
    rndRef.current?.updateSize({ width: nextFrame.width, height: nextFrame.height });
    rndRef.current?.updatePosition({ x: nextFrame.x, y: nextFrame.y });
    triggerFeedback("reset");
  }

  function flushPreview(nextFrame: FloatingFrame, guides: SnapGuide[]) {
    if (previewRafRef.current !== null) {
      window.cancelAnimationFrame(previewRafRef.current);
    }

    previewRafRef.current = window.requestAnimationFrame(() => {
      setPreviewFrame(nextFrame);
      setActiveGuides(guides);
      previewRafRef.current = null;
    });
  }

  useEffect(() => {
    setFrame((current: FloatingFrame) => {
      const nextFrame = normalizeFrame(current);
      rndRef.current?.updateSize({ width: nextFrame.width, height: nextFrame.height });
      rndRef.current?.updatePosition({ x: nextFrame.x, y: nextFrame.y });
      persistFrame(nextFrame);
      return nextFrame;
    });
  }, [viewportSize.height, viewportSize.width]);

  useEffect(() => {
    dockFrameRef.current = normalizeFrame(initialFrame);
    setFrame((current: FloatingFrame) => {
      const nextFrame = current.width > 0 && current.height > 0
        ? normalizeFrame(current)
        : readPersistedFrame(viewportSize) ?? normalizeFrame(initialFrame);
      rndRef.current?.updateSize({ width: nextFrame.width, height: nextFrame.height });
      rndRef.current?.updatePosition({ x: nextFrame.x, y: nextFrame.y });
      persistFrame(nextFrame);
      return nextFrame;
    });
  }, [initialFrame.height, initialFrame.width, initialFrame.x, initialFrame.y, viewportSize]);

  useEffect(() => () => {
    if (previewRafRef.current !== null) {
      window.cancelAnimationFrame(previewRafRef.current);
    }
    if (feedbackTimeoutRef.current !== null) {
      window.clearTimeout(feedbackTimeoutRef.current);
    }
  }, []);

  if (typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <>
      <Rnd
        ref={rndRef}
        data-testid="floating-board-window"
        className={`board-resizable-wrap${isFocused ? " board-resizable-wrap--focused" : ""}${isInteracting ? " board-resizable-wrap--interacting" : ""}${feedbackKind ? ` board-resizable-wrap--feedback-${feedbackKind}` : ""}`}
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
        onDrag={(_event, data) => {
          const nextFrame = normalizeFrame({ ...frame, x: data.x, y: data.y });
          const snapped = snapBoardFrame(nextFrame, viewportSize, dockFrameRef.current);
          flushPreview(nextFrame, snapped.guides);
        }}
        onDragStop={(_event, data) => {
          const snapped = snapBoardFrame(normalizeFrame({ ...frame, x: data.x, y: data.y }), viewportSize, dockFrameRef.current);
          setFrame(snapped.frame);
          persistFrame(snapped.frame);
          rndRef.current?.updatePosition({ x: snapped.frame.x, y: snapped.frame.y });
          setIsInteracting(false);
          setPreviewFrame(null);
          setActiveGuides([]);
          if (snapped.guides.length > 0) {
            triggerFeedback("snap");
          }
        }}
        onResizeStart={() => {
          setIsInteracting(true);
        }}
        onResize={(_event, _direction, ref, _delta, position) => {
          const nextFrame = normalizeFrame({
            x: position.x,
            y: position.y,
            width: ref.offsetWidth,
            height: ref.offsetHeight,
          });
          const snapped = snapBoardFrame(nextFrame, viewportSize, dockFrameRef.current);
          flushPreview(nextFrame, snapped.guides);
        }}
        onResizeStop={(_event, _direction, ref, _delta, position) => {
          const snapped = snapBoardFrame(normalizeFrame({
            x: position.x,
            y: position.y,
            width: ref.offsetWidth,
            height: ref.offsetHeight,
          }), viewportSize, dockFrameRef.current);
          setFrame(snapped.frame);
          persistFrame(snapped.frame);
          rndRef.current?.updateSize({ width: snapped.frame.width, height: snapped.frame.height });
          rndRef.current?.updatePosition({ x: snapped.frame.x, y: snapped.frame.y });
          setIsInteracting(false);
          setPreviewFrame(null);
          setActiveGuides([]);
          if (snapped.guides.length > 0) {
            triggerFeedback("snap");
          }
        }}
        style={{ position: "fixed", zIndex }}
      >
        <div className="board-window" data-testid="board-window-surface" data-focused={isFocused ? "true" : "false"}>
          {isInteracting ? (
            <div className="floating-window-hud" data-testid="board-window-hud">
              <strong>{`${Math.round(currentFrame.width)} × ${Math.round(currentFrame.height)}`}</strong>
              <span>{`X ${Math.round(currentFrame.x)} · Y ${Math.round(currentFrame.y)}`}</span>
              {activeGuides[0] ? <span>{activeGuides[0].label}</span> : null}
              {boundaryHints[0] ? <span>{boundaryHints[0]}</span> : null}
            </div>
          ) : null}
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
          <div className="board-window__canvas">{children}</div>
        </div>
      </Rnd>
      {showRecoveryChip ? (
        <button className="floating-window-recovery-chip" data-testid="board-window-recover" type="button" onClick={() => resetToDock()}>
          {`棋盘已越界 · ${boundaryHints[0]} · 一键找回`}
        </button>
      ) : null}
      {activeGuides.map((guide) => (
        <div
          aria-hidden="true"
          className={`floating-snap-guide floating-snap-guide--${guide.axis === "x" ? "vertical" : "horizontal"}`}
          key={`${guide.axis}-${guide.value}`}
          style={guide.axis === "x" ? { left: guide.value } : { top: guide.value }}
        />
      ))}
    </>,
    document.body,
  );
}
