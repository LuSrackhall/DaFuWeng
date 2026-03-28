import type { PointerEvent as ReactPointerEvent } from "react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Rnd } from "react-rnd";
import {
  buildRecentEventFeed,
  EventFeedPreferences,
  sanitizeEventFeedCustomMaxCount,
  sanitizeEventFeedMinCount,
} from "./roomEventFeed";
import type { FloatingSurfaceDragPreferences } from "./floatingSurfaceDrag";
import { useThirdPartyLongPressDrag } from "./floatingSurfaceDrag";
import type { ProjectionEvent } from "@dafuweng/contracts";

const FLOATING_EVENT_FEED_STORAGE_KEY = "dafuweng-floating-event-feed-frame-v3";
const FEED_MARGIN = 18;
const FEED_TOP_OFFSET = 110;
const FEED_MIN_WIDTH = 340;
const FEED_HEADER_HEIGHT = 48;
const FEED_SETTINGS_HEIGHT = 120;
const FEED_INTRO_HEIGHT = 60;
const FEED_LIST_PADDING = 0;
const FEED_ITEM_GAP = 8;
const FEED_COMPACT_ROW_HEIGHT = 42;
const FEED_NORMAL_ROW_HEIGHT = 58;
const FEED_LARGE_ROW_HEIGHT = 76;
const FEED_RESIZE_STEP = 1;

type DraggableEventFeedProps = {
  events: ProjectionEvent[];
  preferences: EventFeedPreferences;
  onPreferencesChange: (updater: (prev: EventFeedPreferences) => EventFeedPreferences) => void;
  dragPreferences: FloatingSurfaceDragPreferences;
  onDragPreferencesChange: (updater: (prev: FloatingSurfaceDragPreferences) => FloatingSurfaceDragPreferences) => void;
  isFocused: boolean;
  zIndex: number;
  onFocus: () => void;
};

export function DraggableEventFeed({
  events,
  preferences,
  onPreferencesChange,
  dragPreferences,
  onDragPreferencesChange,
  isFocused,
  zIndex,
  onFocus,
}: DraggableEventFeedProps) {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isIntroOpen, setIsIntroOpen] = useState(false);
  const [viewportSize, setViewportSize] = useState(() => ({
    width: typeof window === "undefined" ? 1440 : window.innerWidth,
    height: typeof window === "undefined" ? 900 : window.innerHeight,
  }));
  const rndRef = useRef<Rnd | null>(null);
  const scrollRef = useRef<HTMLOListElement>(null);
  const [isInteracting, setIsInteracting] = useState(false);
  const surfaceRef = useRef<HTMLElement | null>(null);

  const feed = buildRecentEventFeed(events, preferences);

  const chromeHeight = FEED_HEADER_HEIGHT
    + (isIntroOpen ? FEED_INTRO_HEIGHT : 0)
    + (isSettingsOpen ? FEED_SETTINGS_HEIGHT : 0)
    + FEED_LIST_PADDING;
  const minimumHeight = chromeHeight
    + preferences.minItemsCount * FEED_COMPACT_ROW_HEIGHT
    + Math.max(0, preferences.minItemsCount - 1) * FEED_ITEM_GAP;

  const [frame, setFrame] = useState(() => {
    const defaultFrame = {
      x: Math.max(FEED_MARGIN, viewportSize.width - 460),
      y: FEED_TOP_OFFSET,
      width: 380,
      height: Math.max(minimumHeight + 60, 420),
    };

    if (typeof window === "undefined") {
      return defaultFrame;
    }

    try {
      const raw = window.localStorage.getItem(FLOATING_EVENT_FEED_STORAGE_KEY);
      if (!raw) return defaultFrame;
      const parsed = JSON.parse(raw);
      if (typeof parsed.x !== "number" || typeof parsed.y !== "number") return defaultFrame;
      return {
        x: parsed.x,
        y: parsed.y,
        width: Math.max(parsed.width || defaultFrame.width, FEED_MIN_WIDTH),
        height: Math.max(parsed.height || defaultFrame.height, minimumHeight),
      };
    } catch {
      return defaultFrame;
    }
  });

  const dockFrameRef = useRef(frame);
  useEffect(() => {
    dockFrameRef.current = {
      x: Math.max(FEED_MARGIN, viewportSize.width - 460),
      y: FEED_TOP_OFFSET,
      width: 380,
      height: Math.max(minimumHeight + 60, 420),
    };
  }, [minimumHeight, viewportSize.width]);

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
    if (typeof window === "undefined") return undefined;
    const updateViewportSize = () => {
      setViewportSize({ width: window.innerWidth, height: window.innerHeight });
    };
    window.addEventListener("resize", updateViewportSize);
    return () => window.removeEventListener("resize", updateViewportSize);
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

  function persistFrame(nextFrame: typeof frame) {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(FLOATING_EVENT_FEED_STORAGE_KEY, JSON.stringify(nextFrame));
    }
  }

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

    window.requestAnimationFrame(() => element.blur());
  }

  function blurActiveSelectOnSurfacePointerDown(event: ReactPointerEvent<HTMLElement>) {
    if (typeof document === "undefined") {
      return;
    }

    const activeElement = document.activeElement;
    if (!(activeElement instanceof HTMLSelectElement)) {
      return;
    }

    const target = event.target;
    if (target instanceof Node && activeElement.contains(target)) {
      return;
    }

    activeElement.blur();
  }

  function resetToDock() {
    const nextFrame = { ...dockFrameRef.current };
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
      default={{
        x: frame.x,
        y: frame.y,
        width: frame.width,
        height: frame.height,
      }}
      className={`floating-event-feed-shell${isFocused ? " floating-event-feed-shell--focused" : ""}${isInteracting ? " floating-event-feed-shell--interacting" : ""}`}
      minWidth={FEED_MIN_WIDTH}
      minHeight={minimumHeight}
      data-testid="floating-event-feed-window"
      disableDragging={true}
      enableUserSelectHack={true}
      enableResizing={{
        top: true, right: true, bottom: true, left: true,
        topRight: true, bottomRight: true, bottomLeft: true, topLeft: true,
      }}
      resizeHandleClasses={{
        top: "event-feed-resize-handle event-feed-resize-handle--top",
        right: "event-feed-resize-handle event-feed-resize-handle--right",
        bottom: "event-feed-resize-handle event-feed-resize-handle--bottom",
        left: "event-feed-resize-handle event-feed-resize-handle--left",
        topRight: "event-feed-resize-handle event-feed-resize-handle--top-right",
        bottomRight: "event-feed-resize-handle event-feed-resize-handle--bottom-right",
        bottomLeft: "event-feed-resize-handle event-feed-resize-handle--bottom-left",
        topLeft: "event-feed-resize-handle event-feed-resize-handle--top-left",
      }}
      resizeGrid={[FEED_RESIZE_STEP, FEED_RESIZE_STEP]}
      dragGrid={[1, 1]}
      cancel="button, input, select, option, .floating-scroll-list, .floating-event-feed__settings-wrap, .floating-event-feed__intro"
      onMouseDown={onFocus}
      onTouchStart={onFocus}
      onResizeStart={() => {
        onFocus();
        setIsInteracting(true);
      }}
      onResizeStop={(_event, _direction, ref, _delta, position) => {
        setIsInteracting(false);
        const nextFrame = {
          x: position.x,
          y: position.y,
          width: ref.offsetWidth,
          height: ref.offsetHeight,
        };
        setFrame(nextFrame);
        persistFrame(nextFrame);
      }}
      style={{ position: "fixed", zIndex }}
    >
      <section
        ref={surfaceRef}
        className={`floating-event-feed__surface floating-event-feed__surface--${styleDensity}`}
        data-testid="floating-event-feed-surface"
        data-density={styleDensity}
        data-focused={isFocused ? "true" : "false"}
        onPointerDownCapture={blurActiveSelectOnSurfacePointerDown}
        style={{ padding: 0, display: 'flex', flexDirection: 'column', height: '100%' }}
      >
        <div
          className="floating-event-feed__handle"
          data-testid="floating-event-feed-handle"
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', flexShrink: 0 }}
        >
          <div className="floating-event-feed__title-group" data-testid="floating-event-feed-drag-hotspot" style={{ margin: 0, padding: 0 }}>
            <p className="shell__eyebrow" style={{ margin: 0, fontWeight: 'bold' }}>牌局纪事</p>
          </div>
          <div className="floating-event-feed__toolbar-actions" style={{ display: 'flex', gap: '8px' }}>
            <button className="floating-event-feed__settings-toggle" data-testid="floating-event-feed-intro-toggle" type="button" onPointerDown={(e) => e.stopPropagation()} onClick={() => setIsIntroOpen((current) => !current)}>
              {isIntroOpen ? "收起说明" : "说明"}
            </button>
            <button className="floating-event-feed__settings-toggle" data-testid="floating-event-feed-settings-toggle" type="button" onPointerDown={(e) => e.stopPropagation()} onClick={() => setIsSettingsOpen((current) => !current)}>
              {isSettingsOpen ? "收起设置" : "设置"}
            </button>
            <button className="floating-surface__action" data-testid="floating-event-feed-reset" type="button" onPointerDown={(e) => e.stopPropagation()} onClick={() => resetToDock()}>
              归位
            </button>
            <button className="floating-surface__action" data-testid="floating-event-feed-bring-front" type="button" onPointerDown={(e) => e.stopPropagation()} onClick={() => onFocus()}>
              置顶
            </button>
          </div>
        </div>

        {isIntroOpen ? (
          <div className="floating-event-feed__intro" data-testid="floating-event-feed-intro" onPointerDown={(e) => e.stopPropagation()} style={{ padding: '0 16px 12px', flexShrink: 0 }}>
            <strong>如何阅读这份纪事</strong>
            <span>保留全部历史事件。支持全图拖拽及边角缩放，展开设置可修改正反序限制。</span>
          </div>
        ) : null}

        {isSettingsOpen ? (
          <div className="floating-event-feed__settings-wrap" data-testid="floating-event-feed-settings" onPointerDown={(e) => e.stopPropagation()} style={{ padding: '0 16px 12px', flexShrink: 0 }}>
            <div className="floating-event-feed__settings">
              <label className="floating-event-feed__field">
                <strong>序号顺序</strong>
                <select value={preferences.numberingOrder} onChange={(e) => onPreferencesChange((current) => ({ ...current, numberingOrder: e.target.value as "asc" | "desc" }))}>
                  <option value="asc">纪事正序</option>
                  <option value="desc">纪事倒序</option>
                </select>
              </label>
              <label className="floating-event-feed__field">
                <strong>展示顺序</strong>
                <select value={preferences.sortingOrder} onChange={(e) => onPreferencesChange((current) => ({ ...current, sortingOrder: e.target.value as "asc" | "desc" }))}>
                  <option value="asc">旧在上，新在下</option>
                  <option value="desc">新在上，旧在下</option>
                </select>
              </label>
              <label className="floating-event-feed__field">
                <strong>历史保留范围</strong>
                <select
                  data-testid="floating-event-feed-history-mode"
                  value={preferences.historyMode}
                  onChange={(e) => onPreferencesChange((current) => ({
                    ...current,
                    historyMode: e.target.value as "all" | "custom",
                  }))}
                >
                  <option value="all">全部历史事件</option>
                  <option value="custom">自定义最大条数</option>
                </select>
              </label>
              <label className="floating-event-feed__field">
                <strong>拖拽方案</strong>
                <select
                  data-testid="floating-event-feed-drag-mode"
                  value={dragPreferences.dragMode}
                  onChange={(e) => {
                    const nextValue = e.target.value as FloatingSurfaceDragPreferences["dragMode"];
                    onDragPreferencesChange((current) => ({
                      ...current,
                      dragMode: nextValue,
                    }));
                    blurElementOnNextFrame(e.currentTarget);
                  }}
                >
                  <option value="third-party-hold">第三方库整窗长按拖拽</option>
                  <option value="native">原生整窗长按拖拽</option>
                </select>
              </label>
              {preferences.historyMode === "custom" ? (
                <label className="floating-event-feed__field">
                  <strong>最大历史事件条数</strong>
                  <input
                    data-testid="floating-event-feed-custom-max-count"
                    type="number"
                    min={1}
                    max={500}
                    value={preferences.customMaxCount}
                    onChange={(e) => onPreferencesChange((current) => ({
                      ...current,
                      customMaxCount: sanitizeEventFeedCustomMaxCount(Number(e.target.value)),
                    }))}
                  />
                </label>
              ) : null}
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
              <div className="floating-event-feed__metrics" data-testid="floating-event-feed-metrics">
                <span>{`当前展示 ${feed.visibleCount} / 累计 ${feed.totalCount} 条`}</span>
                <span>
                  {feed.hasHiddenEvents
                    ? `已折叠更早 ${feed.hiddenCount} 条历史事件`
                    : "当前保留全部历史事件"}
                </span>
              </div>
            </div>
          </div>
        ) : null}

        <div style={{ padding: '0 16px 16px', margin: 0, flex: 1, overflowY: 'auto', pointerEvents: isInteracting ? "none" : "auto" }}>
          {feed.items.length > 0 ? (
            <ol className="floating-scroll-list" ref={scrollRef} onPointerDown={(e) => e.stopPropagation()} style={{ padding: 0, margin: 0, height: '100%' }}>
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
            <div className="floating-event-feed__empty-wrap" onPointerDown={(e) => e.stopPropagation()} style={{ padding: '16px', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <p className="floating-event-feed__empty">暂无事件</p>
            </div>
          )}
        </div>
      </section>
    </Rnd>,
    document.body,
  );
}
