import type { ProjectionEvent } from "@dafuweng/contracts";

export const EVENT_FEED_PREFERENCES_STORAGE_KEY =
  "dafuweng-room-event-feed-preferences";
export const DEFAULT_EVENT_FEED_MIN_ITEMS = 6;
export const MAX_EVENT_FEED_MIN_ITEMS = 20;
export const DEFAULT_EVENT_FEED_CUSTOM_MAX = 50;
export const MAX_EVENT_FEED_CUSTOM_MAX = 500;

export type EventFeedNumbering = "asc" | "desc";
export type EventFeedSorting = "asc" | "desc";
export type EventFeedHistoryMode = "all" | "custom";

export type EventFeedPreferences = {
  numberingOrder: EventFeedNumbering;
  sortingOrder: EventFeedSorting;
  minItemsCount: number;
  historyMode: EventFeedHistoryMode;
  customMaxCount: number;
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
  historyMode: "all",
  customMaxCount: DEFAULT_EVENT_FEED_CUSTOM_MAX,
};

function clampEventFeedMinItems(value: number) {
  return Math.max(1, Math.min(MAX_EVENT_FEED_MIN_ITEMS, value));
}

function clampEventFeedCustomMax(value: number) {
  return Math.max(1, Math.min(MAX_EVENT_FEED_CUSTOM_MAX, value));
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
  const historyMode =
    raw.historyMode === "custom" ? "custom" : "all";
  
  const parsedMinItemsCount = Number.parseInt(
    String(raw.minItemsCount ?? DEFAULT_EVENT_FEED_MIN_ITEMS),
    10,
  );
  const parsedCustomMaxCount = Number.parseInt(
    String(raw.customMaxCount ?? DEFAULT_EVENT_FEED_CUSTOM_MAX),
    10,
  );

  return {
    numberingOrder,
    sortingOrder,
    minItemsCount: Number.isFinite(parsedMinItemsCount)
      ? clampEventFeedMinItems(parsedMinItemsCount)
      : DEFAULT_EVENT_FEED_MIN_ITEMS,
    historyMode,
    customMaxCount: Number.isFinite(parsedCustomMaxCount)
      ? clampEventFeedCustomMax(parsedCustomMaxCount)
      : DEFAULT_EVENT_FEED_CUSTOM_MAX,
  };
}

export function sanitizeEventFeedMinCount(value: number) {
  if (!Number.isFinite(value)) {
    return DEFAULT_EVENT_FEED_MIN_ITEMS;
  }

  return clampEventFeedMinItems(Math.trunc(value));
}

export function sanitizeEventFeedCustomMaxCount(value: number) {
  if (!Number.isFinite(value)) {
    return DEFAULT_EVENT_FEED_CUSTOM_MAX;
  }

  return clampEventFeedCustomMax(Math.trunc(value));
}

export function buildRecentEventFeed(
  events: ProjectionEvent[],
  preferences: EventFeedPreferences,
) {
  const chronoEvents = [...events].sort((left, right) => left.sequence - right.sequence);
  const total = chronoEvents.length;

  const annotatedEvents = chronoEvents.map((event, index) => {
    return {
      id: event.id,
      sequence: event.sequence,
      summary: event.summary,
      displayNumber: preferences.numberingOrder === "asc" ? index + 1 : total - index,
      isNearest: index === total - 1,
    };
  });

  const retainedItems = preferences.historyMode === "custom"
    ? annotatedEvents.slice(-preferences.customMaxCount)
    : annotatedEvents;

  const items: EventFeedItem[] = preferences.sortingOrder === "asc"
    ? retainedItems
    : [...retainedItems].reverse();
  const hiddenCount = Math.max(0, total - retainedItems.length);

  return {
    items,
    retainedCount: retainedItems.length,
    visibleCount: retainedItems.length,
    totalCount: total,
    hiddenCount,
    hasHiddenEvents: hiddenCount > 0,
  };
}