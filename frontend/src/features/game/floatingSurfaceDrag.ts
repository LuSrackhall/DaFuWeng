import { useDrag } from "@use-gesture/react";
import { useEffect, useLayoutEffect, useRef } from "react";
import type { RefObject } from "react";
import type { Rnd } from "react-rnd";

export const FLOATING_SURFACE_DRAG_PREFERENCES_STORAGE_KEY =
  "dafuweng-floating-surface-drag-preferences-v1";
export const DEFAULT_FLOATING_SURFACE_HOLD_DELAY_MS = 160;

export type FloatingSurfaceDragMode = "native" | "third-party-hold";

export type FloatingSurfaceDragPreferences = {
  dragMode: FloatingSurfaceDragMode;
  holdDelayMs: number;
};

export type FloatingSurfaceFrame = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export const defaultFloatingSurfaceDragPreferences: FloatingSurfaceDragPreferences = {
  dragMode: "third-party-hold",
  holdDelayMs: DEFAULT_FLOATING_SURFACE_HOLD_DELAY_MS,
};

function isPreferenceRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function sanitizeHoldDelayMs(value: unknown) {
  const parsed = Number.parseInt(String(value ?? DEFAULT_FLOATING_SURFACE_HOLD_DELAY_MS), 10);
  if (!Number.isFinite(parsed)) {
    return DEFAULT_FLOATING_SURFACE_HOLD_DELAY_MS;
  }

  return Math.max(120, Math.min(600, parsed));
}

export function sanitizeFloatingSurfaceDragPreferences(
  raw: unknown,
): FloatingSurfaceDragPreferences {
  if (!isPreferenceRecord(raw)) {
    return defaultFloatingSurfaceDragPreferences;
  }

  return {
    dragMode: raw.dragMode === "native" ? "native" : "third-party-hold",
    holdDelayMs: sanitizeHoldDelayMs(raw.holdDelayMs),
  };
}

type UseThirdPartyLongPressDragOptions = {
  enabled: boolean;
  surfaceRef: RefObject<HTMLElement | null>;
  rndRef: RefObject<Rnd | null>;
  frame: FloatingSurfaceFrame;
  onFocus: () => void;
  onInteractingChange: (value: boolean) => void;
  onCommit: (nextFrame: FloatingSurfaceFrame) => void;
  holdDelayMs: number;
};

const DRAG_CANCEL_SELECTOR = [
  "button",
  "input",
  "select",
  "option",
  "textarea",
  "a",
  "label",
  ".react-resizable-handle",
  ".board-window-resize-handle",
  ".event-feed-resize-handle",
].join(", ");

function shouldIgnoreDragTarget(target: EventTarget | null) {
  if (!(target instanceof Element)) {
    return false;
  }

  return target.closest(DRAG_CANCEL_SELECTOR) !== null;
}

type UseNativeLongPressDragOptions = UseThirdPartyLongPressDragOptions;

export function useNativeLongPressDrag({
  enabled,
  surfaceRef,
  rndRef,
  frame,
  onFocus,
  onInteractingChange,
  onCommit,
  holdDelayMs,
}: UseNativeLongPressDragOptions) {
  const frameRef = useRef(frame);

  useLayoutEffect(() => {
    frameRef.current = frame;
  }, [frame]);

  useLayoutEffect(() => {
    if (!enabled || !surfaceRef.current) {
      return;
    }

    const surface = surfaceRef.current;
    let holdTimer: number | null = null;
    let activeKind: "mouse" | "touch" | null = null;
    let startClientX = 0;
    let startClientY = 0;
    let startFrame = frameRef.current;
    let isDragging = false;

    const clearHoldTimer = () => {
      if (holdTimer !== null) {
        window.clearTimeout(holdTimer);
        holdTimer = null;
      }
    };

    const computeNextFrame = (clientX: number, clientY: number) => ({
      ...startFrame,
      x: Math.round(startFrame.x + (clientX - startClientX)),
      y: Math.round(startFrame.y + (clientY - startClientY)),
    });

    const finishDrag = (clientX: number, clientY: number) => {
      const nextFrame = computeNextFrame(clientX, clientY);
      rndRef.current?.updatePosition({ x: nextFrame.x, y: nextFrame.y });
      onInteractingChange(false);
      onCommit(nextFrame);
      isDragging = false;
    };

    const cancelPendingDrag = () => {
      clearHoldTimer();
      activeKind = null;
      isDragging = false;
    };

    const beginPendingDrag = (clientX: number, clientY: number, kind: "mouse" | "touch") => {
      activeKind = kind;
      startClientX = clientX;
      startClientY = clientY;
      startFrame = frameRef.current;
      clearHoldTimer();
      holdTimer = window.setTimeout(() => {
        if (activeKind !== kind) {
          return;
        }

        onFocus();
        onInteractingChange(true);
        isDragging = true;
      }, holdDelayMs);
    };

    const onMouseDown = (event: MouseEvent) => {
      if (event.button !== 0) {
        return;
      }

      if (shouldIgnoreDragTarget(event.target)) {
        return;
      }

      beginPendingDrag(event.clientX, event.clientY, "mouse");
    };

    const onMouseMove = (event: MouseEvent) => {
      if (activeKind !== "mouse") {
        return;
      }

      if (!isDragging) {
        if (Math.abs(event.clientX - startClientX) > 6 || Math.abs(event.clientY - startClientY) > 6) {
          cancelPendingDrag();
        }
        return;
      }

      event.preventDefault();
      const nextFrame = computeNextFrame(event.clientX, event.clientY);
      rndRef.current?.updatePosition({ x: nextFrame.x, y: nextFrame.y });
    };

    const onMouseUp = (event: MouseEvent) => {
      if (activeKind !== "mouse") {
        return;
      }

      clearHoldTimer();
      if (isDragging) {
        finishDrag(event.clientX, event.clientY);
      }

      activeKind = null;
      isDragging = false;
    };

    const onTouchStart = (event: TouchEvent) => {
      if (event.touches.length !== 1) {
        return;
      }

      if (shouldIgnoreDragTarget(event.target)) {
        return;
      }

      const touch = event.touches[0];
      beginPendingDrag(touch.clientX, touch.clientY, "touch");
    };

    const onTouchMove = (event: TouchEvent) => {
      if (activeKind !== "touch" || event.touches.length !== 1) {
        return;
      }

      const touch = event.touches[0];
      if (!isDragging) {
        if (Math.abs(touch.clientX - startClientX) > 6 || Math.abs(touch.clientY - startClientY) > 6) {
          cancelPendingDrag();
        }
        return;
      }

      event.preventDefault();
      const nextFrame = computeNextFrame(touch.clientX, touch.clientY);
      rndRef.current?.updatePosition({ x: nextFrame.x, y: nextFrame.y });
    };

    const onTouchEnd = (event: TouchEvent) => {
      if (activeKind !== "touch") {
        return;
      }

      clearHoldTimer();
      if (isDragging) {
        const touch = event.changedTouches[0];
        finishDrag(touch.clientX, touch.clientY);
      }

      activeKind = null;
      isDragging = false;
    };

    surface.addEventListener("mousedown", onMouseDown, { capture: true });
    surface.addEventListener("touchstart", onTouchStart, { capture: true, passive: true });
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    window.addEventListener("touchmove", onTouchMove, { passive: false });
    window.addEventListener("touchend", onTouchEnd);
    window.addEventListener("touchcancel", onTouchEnd);

    return () => {
      cancelPendingDrag();
      surface.removeEventListener("mousedown", onMouseDown, true);
      surface.removeEventListener("touchstart", onTouchStart, true);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
      window.removeEventListener("touchcancel", onTouchEnd);
    };
  }, [enabled, holdDelayMs, onCommit, onFocus, onInteractingChange, rndRef, surfaceRef]);
}

export function useThirdPartyLongPressDrag({
  enabled,
  surfaceRef,
  rndRef,
  frame,
  onFocus,
  onInteractingChange,
  onCommit,
  holdDelayMs,
}: UseThirdPartyLongPressDragOptions) {
  const frameRef = useRef(frame);

  useEffect(() => {
    frameRef.current = frame;
  }, [frame]);

  useDrag(
    ({ first, last, offset: [offsetX, offsetY], event, memo }) => {
      if (!enabled) {
        return memo;
      }

      if (first) {
        if (shouldIgnoreDragTarget(event.target)) {
          return { blocked: true };
        }

        onFocus();
        onInteractingChange(true);
        return { blocked: false };
      }

      if (!memo || memo.blocked) {
        return memo;
      }

      const nextFrame = {
        ...frameRef.current,
        x: Math.round(offsetX),
        y: Math.round(offsetY),
      };

      rndRef.current?.updatePosition({
        x: nextFrame.x,
        y: nextFrame.y,
      });

      if (last) {
        onInteractingChange(false);
        onCommit(nextFrame);
      }

      return memo;
    },
    {
      target: surfaceRef,
      enabled,
      delay: holdDelayMs,
      from: () => [frameRef.current.x, frameRef.current.y],
      filterTaps: true,
      preventDefault: true,
      pointer: { touch: true, capture: true },
      threshold: 0,
    },
  );
}
