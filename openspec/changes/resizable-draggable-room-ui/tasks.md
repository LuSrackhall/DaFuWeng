# Tasks

## 1. Setup & Primitive Architecture

- [x] 1.1 Create `useDraggable` and `useResizable` core logic (or a `FloatingWindow` wrapper component) handling edges + 4 corners.
- [x] 1.2 Validate pure floating functionality locally.

## 2. Board Resize Implementation

- [x] 2.1 Wrap `BoardScene` container in the resizer.
- [x] 2.2 Wire visual drag handles onto the board boundary.
- [x] 2.3 Ensure PixiJS stage reacts cleanly to container resize operations without jittering.

## 3. Event Feed Engine Rewrite

- [x] 3.1 Migrate Event Feed to the new floating Draggable/Resizable container.
- [x] 3.2 Update context gathering: switch from truncated `recentEvents` to full history event ingestion.
- [x] 3.3 Implement 2-way ordering logic (sequence asc/desc + content asc/desc).
- [x] 3.4 Wire the "Minimum Visible Items" setting and remove old "Visible Count".
- [x] 3.5 Translate container height & "min items" requirement into bounded CSS minimums, preventing further container collapse.
- [x] 3.6 Implement the dynamic style ladder (Compact/Normal/Huge) based on fractional bounds height.
- [x] 3.7 Build UI element to collapse the Setting/Introduction section.

## 4. Scroll Tracking

- [x] 4.1 Implement `useRef` attachment to list bottom/top depending on sort order.
- [x] 4.2 Fire scroll realignment on dice resolution locally.

## 5. Polish and Verification

- [x] 5.1 QA validation of drag clipping, bounding boxes, text breaking, and layout stability.
- [x] 5.2 Execute visual review cycle.

## 6. Iteration Fixes

- [x] 6.1 Remove legacy `board-event-feed` absolute-layout coupling so Rnd controls the event window exclusively.
- [x] 6.2 Convert the board into a controlled draggable-resizable frame bounded by the board stage shell.
- [x] 6.3 Add frosted-glass treatment to the event window and the "现在该做什么" primary action module.
- [x] 6.4 Split the board drag-resize runtime into an isolated floating window component so pointer updates no longer force `GamePage` to rerender every frame.
- [x] 6.5 Add collapsible introduction content to the event feed so the title bar can collapse down to the top-left identity area only.
- [x] 6.6 Add a scenario-aware top guidance banner and an in-session gameplay guide panel.
- [x] 6.7 Portal the board and event-feed floating surfaces to `document.body` so they are no longer clipped by room layout containers.
- [x] 6.8 Add Playwright interaction and screenshot evidence for board drag/resize, event-feed drag/resize, event-feed collapse, top guidance banner, and rules guide panel.
- [x] 6.9 Add persisted docking presets, safer initial placement, and stronger minimum usable-size calibration for the floating board and event-feed windows.
- [x] 6.10 Add an interaction-lightweight mode during drag/resize and strengthen Playwright assertions for initial docking, growth, and minimum-size clamping.
- [x] 6.11 Remove viewport bounds for the floating board and event-feed windows so they can be dragged and resized beyond the current screen while still enforcing minimum size.
- [x] 6.12 Add in-interaction size HUD, snap feedback, and boundary overflow hints, then verify them in Playwright during live drag/resize gestures.
- [x] 6.13 Add explicit reset-to-dock affordances, overflow recovery chips, and light snap or reset rebound feedback for both floating surfaces.
- [x] 6.14 Extend Playwright to validate recovery after dragging or resizing beyond the viewport, including the restore path back to a manageable on-screen state.
- [x] 6.15 Add room-level floating-surface focus management so the board and event feed can be explicitly brought to front without fighting stale per-component z-index rules.
- [x] 6.16 Add focus highlight, bring-to-front controls, and Playwright assertions for default stacking order plus focus-driven z-index changes.
