import { useDrag } from "@use-gesture/react";
import { useEffect, useRef } from "react";
import type { RefObject } from "react";
import type { Rnd } from "react-rnd";

export const FLOATING_SURFACE_DRAG_PREFERENCES_STORAGE_KEY =
  "dafuweng-floating-surface-drag-preferences-v1";
export const DEFAULT_FLOATING_SURFACE_HOLD_DELAY_MS = 180;

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
  handleRef: RefObject<HTMLElement | null>;
  rndRef: RefObject<Rnd | null>;
  frame: FloatingSurfaceFrame;
  onFocus: () => void;
  onInteractingChange: (value: boolean) => void;
  onCommit: (nextFrame: FloatingSurfaceFrame) => void;
  holdDelayMs: number;
};

export function useThirdPartyLongPressDrag({
  enabled,
  handleRef,
  rndRef,
  frame,
  onFocus,
  onInteractingChange,
  onCommit,
  holdDelayMs,
}: UseThirdPartyLongPressDragOptions) {
  const frameRef = useRef(frame);
  const previewFrameRef = useRef(frame);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    frameRef.current = frame;
    previewFrameRef.current = frame;
  }, [frame]);

  useEffect(() => () => {
    if (rafRef.current !== null) {
      window.cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  useDrag(
    ({ first, last, movement: [movementX, movementY], memo }) => {
      if (!enabled) {
        return memo;
      }

      if (first) {
        onFocus();
        onInteractingChange(true);
        return { x: frameRef.current.x, y: frameRef.current.y };
      }

      if (!memo) {
        return memo;
      }

      const nextFrame = {
        ...frameRef.current,
        x: Math.round(memo.x + movementX),
        y: Math.round(memo.y + movementY),
      };

      previewFrameRef.current = nextFrame;

      if (rafRef.current === null) {
        rafRef.current = window.requestAnimationFrame(() => {
          rndRef.current?.updatePosition({
            x: previewFrameRef.current.x,
            y: previewFrameRef.current.y,
          });
          rafRef.current = null;
        });
      }

      if (last) {
        if (rafRef.current !== null) {
          window.cancelAnimationFrame(rafRef.current);
          rafRef.current = null;
        }

        rndRef.current?.updatePosition({ x: nextFrame.x, y: nextFrame.y });
        onInteractingChange(false);
        onCommit(nextFrame);
      }

      return memo;
    },
    {
      target: handleRef,
      enabled,
      delay: holdDelayMs,
      filterTaps: true,
      preventDefault: true,
      pointer: { touch: true },
      threshold: 0,
    },
  );
}