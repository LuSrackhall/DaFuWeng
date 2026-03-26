import type { ProjectionEvent } from "@dafuweng/contracts";

export const EVENT_FEED_PREFERENCES_STORAGE_KEY =
  "dafuweng-room-event-feed-preferences";
export const DEFAULT_EVENT_FEED_MIN_ITEMS = 6;
export const MAX_EVENT_FEED_MIN_ITEMS = 20;

export type EventFeedNumbering = "asc" | "desc";
export type EventFeedSorting = "asc" | "desc";

export type EventFeedPreferences = {
  numberingOrder: EventFeedNumbering;
  sortingOrder: EventFeedSorting;
  minItemsCount: number;
};

export type EventFeedItem = {
  id: string;
  sequence: number;
  summary: string;
  displayNumber: number;
  isNearest: boolean;
};

export const defaultEventFeedPreferences: EventFeedPreferences = {
  numberingOrder: "asc",
  sortingOrder: "asc",
  minItemsCount: DEFAULT_EVENT_FEED_MIN_ITEMS,
};

function clampEventFeedMinItems(value: number) {
  return Math.max(1, Math.min(MAX_EVENT_FEED_MIN_ITEMS, value));
}

function isPreferenceRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function sanitizeEventFeedPreferences(
  raw: unknown,
): EventFeedPreferences {
  if (!isPreferenceRecord(raw)) {
    return defaultEventFeedPreferences;
  }

  const numberingOrder =
    raw.numberingOrder === "desc" ? "desc" : "asc";
  const sortingOrder =
    raw.sortingOrder === "desc" ? "desc" : "asc";
  
  const parsedMinItemsCount = Number.parseInt(
    String(raw.minItemsCount ?? DEFAULT_EVENT_FEED_MIN_ITEMS),
    10,
  );

  return {
    numberingOrder,
    sortingOrder,
    minItemsCount: Number.isFinite(parsedMinItemsCount)
      ? clampEventFeedMinItems(parsedMinItemsCount)
      : DEFAULT_EVENT_FEED_MIN_ITEMS,
  };
}

export function sanitizeEventFeedMinCount(value: number) {
  if (!Number.isFinite(value)) {
    return DEFAULT_EVENT_FEED_MIN_ITEMS;
  }

  return clampEventFeedMinItems(Math.trunc(value));
}

export function buildRecentEventFeed(
  events: ProjectionEvent[],
  preferences: EventFeedPreferences,
) {
  // Always include all events
  const chronoEvents = [...events].sort((left, right) => left.sequence - right.sequence);
  const total = chronoEvents.length;

  // We assign displayNumber based on numberingOrder BEFORE actual sorting to ensure absolute labels
  const annotatedEvents = chronoEvents.map((event, index) => {
    return {
      id: event.id,
      sequence: event.sequence,
      summary: event.summary,
      displayNumber: preferences.numberingOrder === "asc" ? index + 1 : total - index,
      isNearest: index === total - 1,
    };
  });

  // Now apply visual sorting
  const items: EventFeedItem[] = preferences.sortingOrder === "asc"
    ? annotatedEvents
    : annotatedEvents.reverse();

  return {
    items,
    retainedCount: total,
    visibleCount: total,
    hasHiddenEvents: false,
  };
}