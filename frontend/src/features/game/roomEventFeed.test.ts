import { describe, expect, test } from "vitest";
import type { ProjectionEvent } from "@dafuweng/contracts";
import {
  buildRecentEventFeed,
  defaultEventFeedPreferences,
  sanitizeEventFeedCustomMaxCount,
  sanitizeEventFeedMinCount,
  sanitizeEventFeedPreferences,
} from "./roomEventFeed";

function createEvents(count: number): ProjectionEvent[] {
  return Array.from({ length: count }, (_, index) => ({
    id: `evt-${index + 1}`,
    type: "turn-advanced",
    sequence: index + 1,
    snapshotVersion: index + 1,
    summary: `事件 ${index + 1}`,
    nextPlayerId: `p${(index % 4) + 1}`,
  }));
}

describe("roomEventFeed", () => {
  test("returns all events and preserves absolute numbering by default", () => {
    const feed = buildRecentEventFeed(createEvents(12), defaultEventFeedPreferences);

    expect(feed.visibleCount).toBe(12);
    expect(feed.totalCount).toBe(12);
    expect(feed.items).toHaveLength(12);
    expect(feed.items[0]?.sequence).toBe(1);
    expect(feed.items[0]?.displayNumber).toBe(1);
    expect(feed.items.at(-1)?.sequence).toBe(12);
    expect(feed.items.at(-1)?.displayNumber).toBe(12);
    expect(feed.items.at(-1)?.isNearest).toBe(true);
    expect(feed.hasHiddenEvents).toBe(false);
  });

  test("supports desc sorting and desc numbering", () => {
    const feed = buildRecentEventFeed(createEvents(6), {
      ...defaultEventFeedPreferences,
      sortingOrder: "desc",
      numberingOrder: "desc",
    });

    expect(feed.items).toHaveLength(6);
    // Nearest (sequence 6) is at the top
    expect(feed.items[0]?.sequence).toBe(6);
    expect(feed.items[0]?.displayNumber).toBe(1);
    expect(feed.items[0]?.isNearest).toBe(true);
    // Oldest (sequence 1) is at the bottom
    expect(feed.items.at(-1)?.sequence).toBe(1);
    expect(feed.items.at(-1)?.displayNumber).toBe(6);
  });

  test("supports custom maximum history count while keeping absolute event numbering", () => {
    const feed = buildRecentEventFeed(createEvents(6), {
      ...defaultEventFeedPreferences,
      historyMode: "custom",
      customMaxCount: 3,
    });

    expect(feed.totalCount).toBe(6);
    expect(feed.visibleCount).toBe(3);
    expect(feed.hiddenCount).toBe(3);
    expect(feed.hasHiddenEvents).toBe(true);
    expect(feed.items.map((item) => item.sequence)).toEqual([4, 5, 6]);
    expect(feed.items.map((item) => item.displayNumber)).toEqual([4, 5, 6]);
  });

  test("sanitizes broken preferences and clamps count limits", () => {
    expect(
      sanitizeEventFeedPreferences({
        numberingOrder: "sideways",
        sortingOrder: "bizarre",
        minItemsCount: 999,
        historyMode: "mystery",
        customMaxCount: 9999,
      }),
    ).toEqual({
      numberingOrder: "asc",
      sortingOrder: "asc",
      minItemsCount: 20,
      historyMode: "all",
      customMaxCount: 500,
    });

    expect(sanitizeEventFeedMinCount(Number.NaN)).toBe(6);
    expect(sanitizeEventFeedMinCount(0)).toBe(1);
    expect(sanitizeEventFeedCustomMaxCount(Number.NaN)).toBe(50);
    expect(sanitizeEventFeedCustomMaxCount(0)).toBe(1);
  });
});
