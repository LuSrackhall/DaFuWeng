# Tasks

## 1. Setup & Primitive Architecture

- [ ] 1.1 Create `useDraggable` and `useResizable` core logic (or a `FloatingWindow` wrapper component) handling edges + 4 corners.
- [ ] 1.2 Validate pure floating functionality locally.

## 2. Board Resize Implementation

- [ ] 2.1 Wrap `BoardScene` container in the resizer.
- [ ] 2.2 Wire visual drag handles onto the board boundary.
- [ ] 2.3 Ensure PixiJS stage reacts cleanly to container resize operations without jittering.

## 3. Event Feed Engine Rewrite

- [ ] 3.1 Migrate Event Feed to the new floating Draggable/Resizable container.
- [ ] 3.2 Update context gathering: switch from truncated `recentEvents` to full history event ingestion.
- [ ] 3.3 Implement 2-way ordering logic (sequence asc/desc + content asc/desc).
- [ ] 3.4 Wire the "Minimum Visible Items" setting and remove old "Visible Count".
- [ ] 3.5 Translate container height & "min items" requirement into bounded CSS minimums, preventing further container collapse.
- [ ] 3.6 Implement the dynamic style ladder (Compact/Normal/Huge) based on fractional bounds height.
- [ ] 3.7 Build UI element to collapse the Setting/Introduction section.

## 4. Scroll Tracking

- [ ] 4.1 Implement `useRef` attachment to list bottom/top depending on sort order.
- [ ] 4.2 Fire scroll realignment on dice resolution locally.

## 5. Polish and Verification

- [ ] 5.1 QA validation of drag clipping, bounding boxes, text breaking, and layout stability.
- [ ] 5.2 Execute visual review cycle.