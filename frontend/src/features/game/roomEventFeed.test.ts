import { describe, expect, test } from "vitest";
import type { ProjectionEvent } from "@dafuweng/contracts";
import {
  buildRecentEventFeed,
  defaultEventFeedPreferences,
  sanitizeEventFeedCustomCount,
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
  test("defaults to the newest eight events with the nearest event at the bottom", () => {
    const feed = buildRecentEventFeed(createEvents(12), defaultEventFeedPreferences);

    expect(feed.visibleCount).toBe(8);
    expect(feed.items).toHaveLength(8);
    expect(feed.items[0]?.sequence).toBe(5);
    expect(feed.items[0]?.displayNumber).toBe(8);
    expect(feed.items.at(-1)?.sequence).toBe(12);
    expect(feed.items.at(-1)?.displayNumber).toBe(1);
    expect(feed.items.at(-1)?.isNearest).toBe(true);
  });

  test("supports showing the nearest event at the top with larger near-event numbering", () => {
    const feed = buildRecentEventFeed(createEvents(6), {
      ...defaultEventFeedPreferences,
      nearEventPlacement: "top",
      nearEventNumbering: "near-large",
    });

    expect(feed.items[0]?.sequence).toBe(6);
    expect(feed.items[0]?.displayNumber).toBe(6);
    expect(feed.items[0]?.isNearest).toBe(true);
    expect(feed.items.at(-1)?.sequence).toBe(1);
    expect(feed.items.at(-1)?.displayNumber).toBe(1);
  });

  test("sanitizes broken preferences and clamps custom visible counts", () => {
    expect(
      sanitizeEventFeedPreferences({
        nearEventPlacement: "sideways",
        nearEventNumbering: "tiny",
        visibleCountMode: "custom",
        customVisibleCount: 999,
      }),
    ).toEqual({
      ...defaultEventFeedPreferences,
      visibleCountMode: "custom",
      customVisibleCount: 10,
    });

    expect(sanitizeEventFeedCustomCount(Number.NaN)).toBe(8);
    expect(sanitizeEventFeedCustomCount(0)).toBe(1);
  });

  test("shows all retained events when all mode is selected", () => {
    const feed = buildRecentEventFeed(createEvents(9), {
      ...defaultEventFeedPreferences,
      visibleCountMode: "all",
    });

    expect(feed.visibleCount).toBe(9);
    expect(feed.items).toHaveLength(9);
    expect(feed.hasHiddenEvents).toBe(false);
  });
});