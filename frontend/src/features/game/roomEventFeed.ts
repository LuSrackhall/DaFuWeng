import type { ProjectionEvent } from "@dafuweng/contracts";

export const EVENT_FEED_PREFERENCES_STORAGE_KEY =
  "dafuweng-room-event-feed-preferences";
export const DEFAULT_EVENT_FEED_VISIBLE_COUNT = 8;
export const MAX_EVENT_FEED_VISIBLE_COUNT = 10;

export type EventFeedPlacement = "top" | "bottom";
export type EventFeedNumbering = "near-small" | "near-large";
export type EventFeedVisibleCountMode = "default" | "all" | "custom";

export type EventFeedPreferences = {
  nearEventPlacement: EventFeedPlacement;
  nearEventNumbering: EventFeedNumbering;
  visibleCountMode: EventFeedVisibleCountMode;
  customVisibleCount: number;
};

export type EventFeedItem = {
  id: string;
  sequence: number;
  summary: string;
  displayNumber: number;
  isNearest: boolean;
};

export const defaultEventFeedPreferences: EventFeedPreferences = {
  nearEventPlacement: "bottom",
  nearEventNumbering: "near-small",
  visibleCountMode: "default",
  customVisibleCount: DEFAULT_EVENT_FEED_VISIBLE_COUNT,
};

function clampEventFeedVisibleCount(value: number) {
  return Math.max(1, Math.min(MAX_EVENT_FEED_VISIBLE_COUNT, value));
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

  const nearEventPlacement =
    raw.nearEventPlacement === "top" ? "top" : "bottom";
  const nearEventNumbering =
    raw.nearEventNumbering === "near-large" ? "near-large" : "near-small";
  const visibleCountMode: EventFeedVisibleCountMode =
    raw.visibleCountMode === "all"
      ? "all"
      : raw.visibleCountMode === "custom"
        ? "custom"
        : "default";
  const parsedCustomVisibleCount = Number.parseInt(
    String(raw.customVisibleCount ?? DEFAULT_EVENT_FEED_VISIBLE_COUNT),
    10,
  );

  return {
    nearEventPlacement,
    nearEventNumbering,
    visibleCountMode,
    customVisibleCount: Number.isFinite(parsedCustomVisibleCount)
      ? clampEventFeedVisibleCount(parsedCustomVisibleCount)
      : DEFAULT_EVENT_FEED_VISIBLE_COUNT,
  };
}

export function sanitizeEventFeedCustomCount(value: number) {
  if (!Number.isFinite(value)) {
    return DEFAULT_EVENT_FEED_VISIBLE_COUNT;
  }

  return clampEventFeedVisibleCount(Math.trunc(value));
}

export function getEventFeedVisibleCount(
  totalRetainedEvents: number,
  preferences: EventFeedPreferences,
) {
  if (totalRetainedEvents <= 0) {
    return 0;
  }

  if (preferences.visibleCountMode === "all") {
    return totalRetainedEvents;
  }

  if (preferences.visibleCountMode === "custom") {
    return Math.min(totalRetainedEvents, preferences.customVisibleCount);
  }

  return Math.min(totalRetainedEvents, DEFAULT_EVENT_FEED_VISIBLE_COUNT);
}

export function buildRecentEventFeed(
  events: ProjectionEvent[],
  preferences: EventFeedPreferences,
) {
  const retainedEvents = [...events].sort((left, right) => left.sequence - right.sequence);
  const visibleCount = getEventFeedVisibleCount(retainedEvents.length, preferences);
  const visibleEvents = visibleCount > 0
    ? retainedEvents.slice(-visibleCount)
    : [];
  const orderedEvents = preferences.nearEventPlacement === "bottom"
    ? visibleEvents
    : [...visibleEvents].reverse();

  const items: EventFeedItem[] = orderedEvents.map((event, index, collection) => {
    const distanceFromNearest = preferences.nearEventPlacement === "bottom"
      ? collection.length - index - 1
      : index;
    return {
      id: event.id,
      sequence: event.sequence,
      summary: event.summary,
      displayNumber: preferences.nearEventNumbering === "near-small"
        ? distanceFromNearest + 1
        : collection.length - distanceFromNearest,
      isNearest: distanceFromNearest === 0,
    };
  });

  return {
    items,
    retainedCount: retainedEvents.length,
    visibleCount,
    hasHiddenEvents: retainedEvents.length > visibleCount,
  };
}