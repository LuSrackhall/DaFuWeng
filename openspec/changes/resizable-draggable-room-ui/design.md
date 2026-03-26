# Design: Resizable and Draggable Room UI

## 1. Draggable & Resizable DOM Primitive

We will implement a higher-order React Component, custom Hooks (`useDraggable`, `useResizable`), or leverage a lightweight dependency-free CSS/JS wrapper that:
- Provides absolute/fixed positioning over the application coordinate plane.
- Captures pointer down/move/up events to adjust `top/left/width/height`.
- Emits bounding box changes through standard `onChange` callbacks to allow internal React elements to compute layout variables.

### Event Feed Container Adaptation

The Event Feed becomes a floating dialog element wrapper via the Resizable/Draggable framework.
- State will track its bounds `(x, y, w, h)`.
- Internal `ResizeObserver` detects final dimension steps.
- **Dynamic Item Styles**: The feed item React components calculate a density level `compact | normal | expanded` depending on `bounds.h / minVisibleItemsLimit`. If this quotient drops below a pixel threshold, we use `compact`.

### Event Feed Sort Logic

A `useEventFeedSort` hook filters `projection.recentEvents` (if we change to full history, we pull the full event list).
Four combinations:
- Num Asc, Chrono Asc -> 1, 2, 3 ...
- Num Desc, Chrono Asc -> 3, 2, 1 ... (ordered by timeline)
- Num Asc, Chrono Desc -> 1, 2, 3 ... (ordered inverted timeline)
- Num Desc, Chrono Desc -> 3, 2, 1 ... (ordered inverted timeline)

## 2. Board Resizing

The current `<BoardScene />` already stretches across its `.board__stage-shell` flex / grid slot. By wrapping `.board__stage-shell` in a resizable primitive, the internal Pixi App can automatically react to the `ResizeObserver` bounded by the parent `div`.
- It will include standard visible drag handles in all corners/edges.

## 3. Auto-Scroll Architecture

- When `projection.lastRoll` updates, or when the `latestEvent.sequence` increments, trigger a `scrollIntoView` or `scrollTo` operation inside the scrolling viewport tracking the Event Feed items list.
- A boolean ref will prevent bouncing if the user is explicitly reading older logs, except when a forced dice roll override hits.