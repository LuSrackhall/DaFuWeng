import { useEffect, useRef, useState } from "react";
import { Rnd } from "react-rnd";
import useMeasure from "react-use-measure";
import {
  buildRecentEventFeed,
  EventFeedPreferences,
  sanitizeEventFeedMinCount,
} from "./roomEventFeed";
import type { ProjectionEvent } from "@dafuweng/contracts";

const FEED_HEADER_HEIGHT = 76;
const FEED_SETTINGS_HEIGHT = 168;
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
  const [isOpen, setIsOpen] = useState(false);
  const scrollRef = useRef<HTMLOListElement>(null);
  const [containerRef, bounds] = useMeasure();

  const feed = buildRecentEventFeed(events, preferences);
  const chromeHeight = FEED_HEADER_HEIGHT + (isOpen ? FEED_SETTINGS_HEIGHT : 0) + FEED_LIST_PADDING;
  const availableItemHeight = Math.max(
    0,
    bounds.height - chromeHeight - Math.max(0, preferences.minItemsCount - 1) * FEED_ITEM_GAP,
  );
  const exactItemHeight = availableItemHeight / Math.max(1, preferences.minItemsCount);
  const styleDensity = exactItemHeight >= FEED_LARGE_ROW_HEIGHT
    ? "large"
    : exactItemHeight >= FEED_NORMAL_ROW_HEIGHT
      ? "normal"
      : "compact";
  const minimumHeight = FEED_HEADER_HEIGHT
    + (isOpen ? FEED_SETTINGS_HEIGHT : 0)
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

  return (
    <Rnd
      default={{
        x: 24,
        y: 120,
        width: 420,
        height: 420,
      }}
      minWidth={320}
      minHeight={minimumHeight}
      bounds="window"
      className="floating-event-feed-shell"
      dragHandleClassName="floating-event-feed__handle"
      enableUserSelectHack={false}
      resizeGrid={[1, 1]}
      dragGrid={[1, 1]}
      cancel="button, input, select, option, .floating-scroll-list, .floating-event-feed__settings-wrap"
    >
      <section ref={containerRef} className={`floating-event-feed__surface floating-event-feed__surface--${styleDensity}`}>
        <div className="floating-event-feed__handle">
          <div className="floating-event-feed__title-group">
            <p className="shell__eyebrow">牌局纪事</p>
            <strong>拖拽标题栏，或通过边框与四角缩放</strong>
            <span>{`当前窗口至少保留 ${preferences.minItemsCount} 条可视行；到达最小行高后将停止继续缩小。`}</span>
          </div>
          <button
            className="floating-event-feed__settings-toggle"
            type="button"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() => setIsOpen((c) => !c)}
          >
            {isOpen ? "收起设置" : "展开设置"}
          </button>
        </div>
        {isOpen ? (
          <div className="floating-event-feed__settings-wrap" onPointerDown={(e) => e.stopPropagation()}>
            <div className="floating-event-feed__settings">
              <label className="floating-event-feed__field">
                <strong>序号顺序</strong>
                <select
                  value={preferences.numberingOrder}
                  onChange={(e) => onPreferencesChange((c) => ({ ...c, numberingOrder: e.target.value as "asc" | "desc" }))}
                >
                  <option value="asc">纪事正序</option>
                  <option value="desc">纪事倒序</option>
                </select>
              </label>
              <label className="floating-event-feed__field">
                <strong>展示顺序</strong>
                <select
                  value={preferences.sortingOrder}
                  onChange={(e) => onPreferencesChange((c) => ({ ...c, sortingOrder: e.target.value as "asc" | "desc" }))}
                >
                  <option value="asc">旧在上，新在下</option>
                  <option value="desc">新在上，旧在下</option>
                </select>
              </label>
              <label className="floating-event-feed__field floating-event-feed__field--wide">
                <strong>最小可视条数限制 (联动缩放密度)</strong>
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={preferences.minItemsCount}
                  onChange={(e) => onPreferencesChange((c) => ({ ...c, minItemsCount: sanitizeEventFeedMinCount(Number(e.target.value)) }))}
                />
              </label>
              <div className="floating-event-feed__metrics">
                <span>{`当前自动档位：${styleDensity === "large" ? "Large" : styleDensity === "normal" ? "Normal" : "Compact"}`}</span>
                <span>{`推导单条高度：${Math.round(exactItemHeight)}px`}</span>
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
    </Rnd>
  );
}