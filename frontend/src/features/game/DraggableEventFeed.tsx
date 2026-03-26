import { useEffect, useRef, useState } from "react";
import { Rnd } from "react-rnd";
import useMeasure from "react-use-measure";
import {
  buildRecentEventFeed,
  EventFeedPreferences,
  sanitizeEventFeedMinCount,
} from "./roomEventFeed";
import type { ProjectionEvent } from "@dafuweng/contracts";

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
  const headerHeight = isOpen ? 180 : 80;
  const innerHeight = Math.max(0, bounds.height - headerHeight);
  // Using bounding height dynamically to determine compact/normal/large density
  const exactItemHeight = innerHeight / Math.max(1, preferences.minItemsCount);
  
  // Dynamic Scaling based on the list item available heights
  const styleDensity = exactItemHeight < 48 ? "compact" : exactItemHeight < 72 ? "normal" : "large";

  useEffect(() => {
    if (scrollRef.current) {
      if (preferences.sortingOrder === "asc") {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      } else {
        scrollRef.current.scrollTop = 0;
      }
    }
  }, [events.length, preferences.sortingOrder]);

  return (
    <Rnd
      default={{
        x: 24,
        y: window.innerHeight - 400,
        width: 380,
        height: 380,
      }}
      minWidth={280}
      minHeight={(isOpen ? 220 : 80) + preferences.minItemsCount * 30}
      bounds="window"
      className="floating-event-feed"
      dragHandleClassName="floating-event-feed__handle"
    >
      <section ref={containerRef} className={`board-event-feed board-event-feed--dynamic board-event-feed--${styleDensity}`}>
        <div className="floating-event-feed__handle">
          <div className="board-event-feed__copy" style={{ pointerEvents: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <p className="shell__eyebrow" style={{ margin: 0 }}>牌局纪事</p>
            <strong style={{ fontSize: '1rem' }}>拖拽标题栏或缩放角</strong>
          </div>
          <button
            className="board-event-feed__settings-toggle"
            type="button"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() => setIsOpen((c) => !c)}
          >
            {isOpen ? "收起设置" : "展开设置"}
          </button>
        </div>
        {isOpen ? (
          <div className="floating-event-feed__settings-wrap" onPointerDown={(e) => e.stopPropagation()}>
            <div className="board-event-feed__settings">
              <label className="board-event-feed__field">
                <strong>序号顺序</strong>
                <select
                  value={preferences.numberingOrder}
                  onChange={(e) => onPreferencesChange((c) => ({ ...c, numberingOrder: e.target.value as "asc" | "desc" }))}
                >
                  <option value="asc">纪事正序</option>
                  <option value="desc">纪事倒序</option>
                </select>
              </label>
              <label className="board-event-feed__field">
                <strong>展示顺序</strong>
                <select
                  value={preferences.sortingOrder}
                  onChange={(e) => onPreferencesChange((c) => ({ ...c, sortingOrder: e.target.value as "asc" | "desc" }))}
                >
                  <option value="asc">旧在上，新茬在下</option>
                  <option value="desc">新在上，旧茬在下</option>
                </select>
              </label>
              <label className="board-event-feed__field board-event-feed__field--wide">
                <strong>最小可视条数限制 (联动缩放密度)</strong>
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={preferences.minItemsCount}
                  onChange={(e) => onPreferencesChange((c) => ({ ...c, minItemsCount: sanitizeEventFeedMinCount(Number(e.target.value)) }))}
                />
              </label>
            </div>
          </div>
        ) : null}
        
        {feed.items.length > 0 ? (
          <ol className="floating-scroll-list" ref={scrollRef} onPointerDown={(e) => e.stopPropagation()}>
            {feed.items.map((item) => (
              <li className={`board-event-feed__item${item.isNearest ? " board-event-feed__item--nearest" : ""}`} key={item.id}>
                <span className="board-event-feed__number">{item.displayNumber}</span>
                <div className="board-event-feed__body">
                  <strong>{item.summary}</strong>
                </div>
              </li>
            ))}
          </ol>
        ) : (
          <div style={{ padding: '16px', color: 'rgba(255,255,255,0.6)' }} onPointerDown={(e) => e.stopPropagation()}>
            <p className="board-event-feed__empty">暂无事件</p>
          </div>
        )}
      </section>
    </Rnd>
  );
}