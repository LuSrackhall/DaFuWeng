import { describe, expect, test } from "vitest";
import type { ProjectionEvent } from "@dafuweng/contracts";
import {
  buildRecentEventFeed,
  defaultEventFeedPreferences,
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
  test("returns all events and sets default numbering", () => {
    const feed = buildRecentEventFeed(createEvents(12), defaultEventFeedPreferences);

    expect(feed.visibleCount).toBe(12);
    expect(feed.items).toHaveLength(12);
    expect(feed.items[0]?.sequence).toBe(1);
    expect(feed.items[0]?.displayNumber).toBe(1);
    expect(feed.items.at(-1)?.sequence).toBe(12);
    expect(feed.items.at(-1)?.displayNumber).toBe(12);
    expect(feed.items.at(-1)?.isNearest).toBe(true);
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

  test("sanitizes broken preferences and clamps count limits", () => {
    expect(
      sanitizeEventFeedPreferences({
        numberingOrder: "sideways",
        sortingOrder: "bizarre",
        minItemsCount: 999,
      }),
    ).toEqual({
      numberingOrder: "asc", 
      sortingOrder: "asc", 
      minItemsCount: 20, // max is 20
    });

    expect(sanitizeEventFeedMinCount(Number.NaN)).toBe(6);
    expect(sanitizeEventFeedMinCount(0)).toBe(1); // min is 1
  });
});
