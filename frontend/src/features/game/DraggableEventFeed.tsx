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
  const exactItemHeight = innerHeight / Math.max(1, preferences.minItemsCount);
  
  const styleDensity = exactItemHeight < 40 ? "compact" : exactItemHeight < 60 ? "normal" : "large";

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
        width: 320,
        height: 380,
      }}
      minWidth={240}
      minHeight={(isOpen ? 220 : 100) + preferences.minItemsCount * 30}
      bounds="window"
      className="floating-event-feed"
      dragHandleClassName="floating-event-feed__handle"
    >
      <section ref={containerRef} className={`board-event-feed board-event-feed--dynamic board-event-feed--${styleDensity}`}>
        <div className="board-event-feed__header floating-event-feed__handle">
          <div className="board-event-feed__copy" style={{ pointerEvents: 'none' }}>
            <p className="shell__eyebrow">牌局纪事</p>
            <strong>拖拽或缩放对话框</strong>
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
          <div className="board-event-feed__settings" onPointerDown={(e) => e.stopPropagation()}>
            <label className="board-event-feed__field">
              <strong>序号顺序</strong>
              <select
                value={preferences.numberingOrder}
                onChange={(e) => onPreferencesChange((c) => ({ ...c, numberingOrder: e.target.value as "asc" | "desc" }))}
              >
                <option value="asc">正序 (1,2,3...)</option>
                <option value="desc">反序 (...,3,2,1)</option>
              </select>
            </label>
            <label className="board-event-feed__field">
              <strong>事件排序</strong>
              <select
                value={preferences.sortingOrder}
                onChange={(e) => onPreferencesChange((c) => ({ ...c, sortingOrder: e.target.value as "asc" | "desc" }))}
              >
                <option value="asc">正序 (先发生的在上)</option>
                <option value="desc">反序 (新发生的在上)</option>
              </select>
            </label>
            <label className="board-event-feed__field board-event-feed__field--wide">
              <strong>最小可视条数</strong>
              <input
                type="number"
                min={1}
                max={20}
                value={preferences.minItemsCount}
                onChange={(e) => onPreferencesChange((c) => ({ ...c, minItemsCount: sanitizeEventFeedMinCount(Number(e.target.value)) }))}
              />
            </label>
          </div>
        ) : null}
        
        {feed.items.length > 0 ? (
          <ol className="board-event-feed__list floating-scroll-list" ref={scrollRef} onPointerDown={(e) => e.stopPropagation()}>
            {feed.items.map((item) => (
              <li className={`board-event-feed__item${item.isNearest ? " board-event-feed__item--nearest" : ""}`} key={item.id}>
                <span className="board-event-feed__number">{item.displayNumber}.</span>
                <div className="board-event-feed__body">
                  <strong>{item.summary}</strong>
                </div>
              </li>
            ))}
          </ol>
        ) : (
          <p className="board-event-feed__empty">暂无事件</p>
        )}
      </section>
    </Rnd>
  );
}