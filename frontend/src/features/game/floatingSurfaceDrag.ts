import { useDrag } from "@use-gesture/react";
import { useEffect, useRef } from "react";
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

  function shouldIgnoreDragTarget(target: EventTarget | null) {
    if (!(target instanceof Element)) {
      return false;
    }

    return target.closest("button, input, select, option, textarea, a, label, .react-resizable-handle") !== null;
  }

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
