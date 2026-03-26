import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Rnd } from "react-rnd";
import {
  buildRecentEventFeed,
  EventFeedPreferences,
  sanitizeEventFeedMinCount,
} from "./roomEventFeed";
import type { ProjectionEvent } from "@dafuweng/contracts";

const FLOATING_EVENT_FEED_STORAGE_KEY = "dafuweng-floating-event-feed-frame-v2";
const FEED_MARGIN = 18;
const FEED_TOP_OFFSET = 110;
const FEED_MIN_WIDTH = 340;
const FEED_HEADER_HEIGHT = 76;
const FEED_SETTINGS_HEIGHT = 176;
const FEED_INTRO_HEIGHT = 86;
const FEED_LIST_PADDING = 24;
const FEED_ITEM_GAP = 8;
const FEED_COMPACT_ROW_HEIGHT = 42;
const FEED_NORMAL_ROW_HEIGHT = 58;
const FEED_LARGE_ROW_HEIGHT = 76;
const FEED_RESIZE_STEP = 12;

type DraggableEventFeedProps = {
  events: ProjectionEvent[];
  preferences: EventFeedPreferences;
  onPreferencesChange: (updater: (prev: EventFeedPreferences) => EventFeedPreferences) => void;
};

function renderResizeHandle(prefix: string, direction: string) {
  return <span className={`floating-resize-handle floating-resize-handle--${direction}`} data-testid={`${prefix}-resize-${direction}`} />;
}

function clampEventFeedFrame(
  frame: { x: number; y: number; width: number; height: number },
  viewportSize: { width: number; height: number },
  minimumHeight: number,
) {
  const width = Math.min(Math.max(frame.width, FEED_MIN_WIDTH), Math.max(FEED_MIN_WIDTH, viewportSize.width - FEED_MARGIN * 2));
  const height = Math.min(Math.max(frame.height, minimumHeight), Math.max(minimumHeight, viewportSize.height - FEED_TOP_OFFSET - FEED_MARGIN));

  return {
    x: Math.min(Math.max(frame.x, FEED_MARGIN), Math.max(FEED_MARGIN, viewportSize.width - width - FEED_MARGIN)),
    y: Math.min(Math.max(frame.y, FEED_TOP_OFFSET), Math.max(FEED_TOP_OFFSET, viewportSize.height - height - FEED_MARGIN)),
    width,
    height,
  };
}

function readPersistedEventFeedFrame(
  viewportSize: { width: number; height: number },
  minimumHeight: number,
) {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(FLOATING_EVENT_FEED_STORAGE_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as Partial<{ x: number; y: number; width: number; height: number }>;
    if (
      typeof parsed.x !== "number"
      || typeof parsed.y !== "number"
      || typeof parsed.width !== "number"
      || typeof parsed.height !== "number"
    ) {
      return null;
    }

    return clampEventFeedFrame(parsed as { x: number; y: number; width: number; height: number }, viewportSize, minimumHeight);
  } catch {
    return null;
  }
}

function persistEventFeedFrame(frame: { x: number; y: number; width: number; height: number }) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(FLOATING_EVENT_FEED_STORAGE_KEY, JSON.stringify(frame));
}

function snapSize(value: number) {
  return Math.round(value / FEED_RESIZE_STEP) * FEED_RESIZE_STEP;
}

export function DraggableEventFeed({ events, preferences, onPreferencesChange }: DraggableEventFeedProps) {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isIntroOpen, setIsIntroOpen] = useState(false);
  const [viewportSize, setViewportSize] = useState(() => ({
    width: typeof window === "undefined" ? 1440 : window.innerWidth,
    height: typeof window === "undefined" ? 900 : window.innerHeight,
  }));
  const scrollRef = useRef<HTMLOListElement>(null);
  const resizeFrameRef = useRef<number | null>(null);
  const [isInteracting, setIsInteracting] = useState(false);

  const feed = buildRecentEventFeed(events, preferences);
  const chromeHeight = FEED_HEADER_HEIGHT
    + (isIntroOpen ? FEED_INTRO_HEIGHT : 0)
    + (isSettingsOpen ? FEED_SETTINGS_HEIGHT : 0)
    + FEED_LIST_PADDING;
  const minimumHeight = FEED_HEADER_HEIGHT
    + (isIntroOpen ? FEED_INTRO_HEIGHT : 0)
    + (isSettingsOpen ? FEED_SETTINGS_HEIGHT : 0)
    + FEED_LIST_PADDING
    + preferences.minItemsCount * FEED_COMPACT_ROW_HEIGHT
    + Math.max(0, preferences.minItemsCount - 1) * FEED_ITEM_GAP;
  const [frame, setFrame] = useState(() => {
    const defaultFrame = {
      x: Math.max(FEED_MARGIN, viewportSize.width - 460),
      y: FEED_TOP_OFFSET,
      width: 420,
      height: Math.max(minimumHeight + 60, 420),
    };
    return readPersistedEventFeedFrame(viewportSize, minimumHeight) ?? clampEventFeedFrame(defaultFrame, viewportSize, minimumHeight);
  });
  const availableItemHeight = Math.max(
    0,
    frame.height - chromeHeight - Math.max(0, preferences.minItemsCount - 1) * FEED_ITEM_GAP,
  );
  const exactItemHeight = availableItemHeight / Math.max(1, preferences.minItemsCount);
  const styleDensity = exactItemHeight >= FEED_LARGE_ROW_HEIGHT
    ? "large"
    : exactItemHeight >= FEED_NORMAL_ROW_HEIGHT
      ? "normal"
      : "compact";
  const latestSequence = events.at(-1)?.sequence ?? 0;

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    const updateViewportSize = () => {
      setViewportSize({ width: window.innerWidth, height: window.innerHeight });
    };

    window.addEventListener("resize", updateViewportSize);
    return () => {
      window.removeEventListener("resize", updateViewportSize);
    };
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      if (preferences.sortingOrder === "asc") {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      } else {
        scrollRef.current.scrollTop = 0;
      }
    }
  }, [latestSequence, preferences.sortingOrder]);

  useEffect(() => () => {
    if (resizeFrameRef.current !== null) {
      window.cancelAnimationFrame(resizeFrameRef.current);
    }
  }, []);

  useEffect(() => {
    setFrame((current) => {
      const nextFrame = clampEventFeedFrame(current, viewportSize, minimumHeight);
      persistEventFeedFrame(nextFrame);
      return nextFrame;
    });
  }, [minimumHeight, viewportSize.height, viewportSize.width]);

  if (typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <Rnd
      default={{
        x: frame.x,
        y: frame.y,
        width: frame.width,
        height: frame.height,
      }}
      className={`floating-event-feed-shell${isInteracting ? " floating-event-feed-shell--interacting" : ""}`}
      minWidth={FEED_MIN_WIDTH}
      minHeight={minimumHeight}
      bounds="window"
      data-testid="floating-event-feed-window"
      dragHandleClassName="floating-event-feed__handle"
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
        top: renderResizeHandle("event-feed", "top"),
        right: renderResizeHandle("event-feed", "right"),
        bottom: renderResizeHandle("event-feed", "bottom"),
        left: renderResizeHandle("event-feed", "left"),
        topRight: renderResizeHandle("event-feed", "top-right"),
        bottomRight: renderResizeHandle("event-feed", "bottom-right"),
        bottomLeft: renderResizeHandle("event-feed", "bottom-left"),
        topLeft: renderResizeHandle("event-feed", "top-left"),
      }}
      resizeGrid={[FEED_RESIZE_STEP, FEED_RESIZE_STEP]}
      dragGrid={[1, 1]}
      cancel="button, input, select, option, .floating-scroll-list, .floating-event-feed__settings-wrap, .floating-event-feed__intro"
      onDragStart={() => {
        setIsInteracting(true);
      }}
      onDragStop={(_event, data) => {
        const nextFrame = clampEventFeedFrame({ ...frame, x: data.x, y: data.y }, viewportSize, minimumHeight);
        setFrame(nextFrame);
        persistEventFeedFrame(nextFrame);
        setIsInteracting(false);
      }}
      onResizeStart={() => {
        setIsInteracting(true);
      }}
      onResize={(_event, _direction, ref, _delta, position) => {
        if (resizeFrameRef.current !== null) {
          window.cancelAnimationFrame(resizeFrameRef.current);
        }
        resizeFrameRef.current = window.requestAnimationFrame(() => {
          setFrame((current) => {
            const nextFrame = clampEventFeedFrame({
              ...current,
              width: snapSize(ref.offsetWidth),
              height: snapSize(ref.offsetHeight),
              x: current.x,
              y: current.y,
            }, viewportSize, minimumHeight);
            return nextFrame.width === current.width && nextFrame.height === current.height
              ? current
              : nextFrame;
          });
          resizeFrameRef.current = null;
        });
      }}
      onResizeStop={(_event, _direction, ref, _delta, position) => {
        if (resizeFrameRef.current !== null) {
          window.cancelAnimationFrame(resizeFrameRef.current);
          resizeFrameRef.current = null;
        }
        const nextFrame = clampEventFeedFrame({
          x: position.x,
          y: position.y,
          width: snapSize(ref.offsetWidth),
          height: snapSize(ref.offsetHeight),
        }, viewportSize, minimumHeight);
        setFrame(nextFrame);
        persistEventFeedFrame(nextFrame);
        setIsInteracting(false);
      }}
      style={{ position: "fixed", zIndex: 8 }}
    >
      <section className={`floating-event-feed__surface floating-event-feed__surface--${styleDensity}`} data-testid="floating-event-feed-surface" data-density={styleDensity}>
        <div className="floating-event-feed__handle" data-testid="floating-event-feed-handle">
          <div className="floating-event-feed__title-group">
            <p className="shell__eyebrow">牌局纪事</p>
            <strong>拖拽标题栏，或通过边框与四角缩放</strong>
            <span>{`当前窗口至少保留 ${preferences.minItemsCount} 条可视行；到达最小行高后将停止继续缩小。`}</span>
          </div>
          <div className="floating-event-feed__toolbar-actions">
            <button
              className="floating-event-feed__settings-toggle"
              data-testid="floating-event-feed-intro-toggle"
              type="button"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={() => setIsIntroOpen((current) => !current)}
            >
              {isIntroOpen ? "收起说明" : "展开说明"}
            </button>
            <button
              className="floating-event-feed__settings-toggle"
              data-testid="floating-event-feed-settings-toggle"
              type="button"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={() => setIsSettingsOpen((current) => !current)}
            >
              {isSettingsOpen ? "收起设置" : "展开设置"}
            </button>
          </div>
        </div>
        {isIntroOpen ? (
          <div className="floating-event-feed__intro" data-testid="floating-event-feed-intro" onPointerDown={(e) => e.stopPropagation()}>
            <strong>如何阅读这份纪事</strong>
            <span>它会保留全部历史事件。你可以决定序号方向、列表正反序，以及当前窗口至少要能看到多少条记录。</span>
            <span>缩小窗口时，列表会按 Compact / Normal / Large 三档自动切换；当已经到达最小档且最小条数仍满足时，窗口才会停止继续缩小。</span>
          </div>
        ) : null}
        {isSettingsOpen ? (
          <div className="floating-event-feed__settings-wrap" data-testid="floating-event-feed-settings" onPointerDown={(e) => e.stopPropagation()}>
            <div className="floating-event-feed__settings">
              <label className="floating-event-feed__field">
                <strong>序号顺序</strong>
                <select
                  value={preferences.numberingOrder}
                  onChange={(e) => onPreferencesChange((current) => ({ ...current, numberingOrder: e.target.value as "asc" | "desc" }))}
                >
                  <option value="asc">纪事正序</option>
                  <option value="desc">纪事倒序</option>
                </select>
              </label>
              <label className="floating-event-feed__field">
                <strong>展示顺序</strong>
                <select
                  value={preferences.sortingOrder}
                  onChange={(e) => onPreferencesChange((current) => ({ ...current, sortingOrder: e.target.value as "asc" | "desc" }))}
                >
                  <option value="asc">旧在上，新在下</option>
                  <option value="desc">新在上，旧在下</option>
                </select>
              </label>
              <label className="floating-event-feed__field floating-event-feed__field--wide">
                <strong>最小可视条数限制</strong>
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={preferences.minItemsCount}
                  onChange={(e) => onPreferencesChange((current) => ({
                    ...current,
                    minItemsCount: sanitizeEventFeedMinCount(Number(e.target.value)),
                  }))}
                />
              </label>
              <div className="floating-event-feed__metrics">
                <span>{`当前自动档位：${styleDensity === "large" ? "Large" : styleDensity === "normal" ? "Normal" : "Compact"}`}</span>
                <span>{`推导单条高度：${Math.round(exactItemHeight)}px`}</span>
                <span>{`当前窗口：${Math.round(frame.width)} × ${Math.round(frame.height)}`}</span>
              </div>
            </div>
          </div>
        ) : null}

        {feed.items.length > 0 ? (
          <ol className="floating-scroll-list" ref={scrollRef} onPointerDown={(e) => e.stopPropagation()}>
            {feed.items.map((item) => (
              <li className={`floating-event-feed__item${item.isNearest ? " floating-event-feed__item--nearest" : ""}`} key={item.id}>
                <span className="floating-event-feed__number">{item.displayNumber}</span>
                <div className="floating-event-feed__body">
                  <strong>{item.summary}</strong>
                  <span>{item.isNearest ? `最新事件 · 序列 ${item.sequence}` : `事件序列 ${item.sequence}`}</span>
                </div>
              </li>
            ))}
          </ol>
        ) : (
          <div className="floating-event-feed__empty-wrap" onPointerDown={(e) => e.stopPropagation()}>
            <p className="floating-event-feed__empty">暂无事件</p>
          </div>
        )}
      </section>
    </Rnd>,
    document.body,
  );
}
