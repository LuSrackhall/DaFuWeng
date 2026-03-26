import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Rnd } from "react-rnd";
import {
  buildRecentEventFeed,
  EventFeedPreferences,
  sanitizeEventFeedMinCount,
} from "./roomEventFeed";
import type { ProjectionEvent } from "@dafuweng/contracts";

const FEED_HEADER_HEIGHT = 76;
const FEED_SETTINGS_HEIGHT = 176;
const FEED_INTRO_HEIGHT = 86;
const FEED_LIST_PADDING = 24;
const FEED_ITEM_GAP = 8;
const FEED_COMPACT_ROW_HEIGHT = 42;
const FEED_NORMAL_ROW_HEIGHT = 58;
const FEED_LARGE_ROW_HEIGHT = 76;

type DraggableEventFeedProps = {
  events: ProjectionEvent[];
  preferences: EventFeedPreferences;
  onPreferencesChange: (updater: (prev: EventFeedPreferences) => EventFeedPreferences) => void;
};

export function DraggableEventFeed({ events, preferences, onPreferencesChange }: DraggableEventFeedProps) {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isIntroOpen, setIsIntroOpen] = useState(false);
  const [frameSize, setFrameSize] = useState({ width: 420, height: 420 });
  const [framePosition, setFramePosition] = useState({ x: 24, y: 120 });
  const scrollRef = useRef<HTMLOListElement>(null);
  const resizeFrameRef = useRef<number | null>(null);

  const feed = buildRecentEventFeed(events, preferences);
  const chromeHeight = FEED_HEADER_HEIGHT
    + (isIntroOpen ? FEED_INTRO_HEIGHT : 0)
    + (isSettingsOpen ? FEED_SETTINGS_HEIGHT : 0)
    + FEED_LIST_PADDING;
  const availableItemHeight = Math.max(
    0,
    frameSize.height - chromeHeight - Math.max(0, preferences.minItemsCount - 1) * FEED_ITEM_GAP,
  );
  const exactItemHeight = availableItemHeight / Math.max(1, preferences.minItemsCount);
  const styleDensity = exactItemHeight >= FEED_LARGE_ROW_HEIGHT
    ? "large"
    : exactItemHeight >= FEED_NORMAL_ROW_HEIGHT
      ? "normal"
      : "compact";
  const minimumHeight = FEED_HEADER_HEIGHT
    + (isIntroOpen ? FEED_INTRO_HEIGHT : 0)
    + (isSettingsOpen ? FEED_SETTINGS_HEIGHT : 0)
    + FEED_LIST_PADDING
    + preferences.minItemsCount * FEED_COMPACT_ROW_HEIGHT
    + Math.max(0, preferences.minItemsCount - 1) * FEED_ITEM_GAP;
  const latestSequence = events.at(-1)?.sequence ?? 0;

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

  if (typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <Rnd
      default={{
        x: framePosition.x,
        y: framePosition.y,
        width: frameSize.width,
        height: frameSize.height,
      }}
      minWidth={320}
      minHeight={minimumHeight}
      bounds="window"
      data-testid="floating-event-feed-window"
      className="floating-event-feed-shell"
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
      resizeGrid={[1, 1]}
      dragGrid={[1, 1]}
      cancel="button, input, select, option, .floating-scroll-list, .floating-event-feed__settings-wrap, .floating-event-feed__intro"
      onDragStop={(_event, data) => {
        setFramePosition({ x: data.x, y: data.y });
      }}
      onResize={(_event, _direction, ref, _delta, position) => {
        if (resizeFrameRef.current !== null) {
          window.cancelAnimationFrame(resizeFrameRef.current);
        }
        resizeFrameRef.current = window.requestAnimationFrame(() => {
          setFrameSize({ width: ref.offsetWidth, height: ref.offsetHeight });
          resizeFrameRef.current = null;
        });
        setFramePosition({ x: position.x, y: position.y });
      }}
      onResizeStop={(_event, _direction, ref, _delta, position) => {
        if (resizeFrameRef.current !== null) {
          window.cancelAnimationFrame(resizeFrameRef.current);
          resizeFrameRef.current = null;
        }
        setFrameSize({ width: ref.offsetWidth, height: ref.offsetHeight });
        setFramePosition({ x: position.x, y: position.y });
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
                <span>{`当前窗口：${Math.round(frameSize.width)} × ${Math.round(frameSize.height)}`}</span>
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
