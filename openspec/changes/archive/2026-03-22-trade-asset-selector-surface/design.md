## Context

The previous slice fixed trade readability at the stage level, but the proposal editor still exposes implementation-facing strings for properties and cards. That causes two product problems:

1. Players can still compose invalid or confusing offers because they are typing identifiers instead of selecting from real assets.
2. The room page still leaks internal structure at the exact point where players should feel the most confident about what they are offering and requesting.

The authoritative backend contract already accepts arrays of asset identifiers and performs final validation. This slice focuses on making the proposal surface worthy of that backend flow.

## Goals / Non-Goals

**Goals:**
- Replace raw property/card ID text entry with selectable asset lists.
- Keep proposal and preview synchronized from a single draft state.
- Show why some assets cannot be selected when the restriction is already known on the client.
- Keep the implementation frontend-only.

**Non-Goals:**
- No protocol, backend, or persistence changes.
- No counter-offers, value scoring, negotiation history, or chat.
- No drag-and-drop or cinematic trade animation system.

## Decisions

### 1. Model trade draft assets as arrays instead of comma-delimited strings

Property and card selections will move from free-text state into explicit arrays of selected IDs.

Why:
- The request payload already expects arrays.
- This removes string parsing as a UI concern and makes selection state reliable.

### 2. Build selector pools directly from authoritative player assets

The proposal surface will derive selectable property and card chips from the active player and selected counterparty.

Why:
- This guarantees the chooser reflects the latest room snapshot.
- It prevents players from offering or requesting assets that are not currently visible in-room.

### 3. Mark blocked properties in the selector instead of hiding them

If a property should not be tradeable because its color group still contains improvements, it will remain visible but disabled with a clear reason.

Why:
- Hiding blocked assets creates confusion and makes the player wonder whether the asset disappeared.
- Disabled visibility teaches the rule instead of turning it into a submission-time surprise.

### 4. Keep cash entry simple for this slice

Cash stays as numeric input while properties and cards become selector chips.

Why:
- Cash is not causing the same UX or correctness problems as asset identifiers.
- This keeps the slice focused and avoids unnecessary editor redesign.

## Risks / Trade-offs

- [Client-side blocked-state logic could drift from backend validation] -> Limit blocking logic to rules already visible from the current snapshot and leave final authority to the server.
- [Selector UI becomes too dense on mobile] -> Use compact grouped chips and preserve the bilateral summary above the selection lists.
- [Players may still want stronger valuation hints] -> Explicitly defer value guidance to a later slice.

## Migration Plan

1. Add OpenSpec deltas describing selector-based trade proposal behavior.
2. Refactor trade draft state from strings to asset ID arrays.
3. Render property and card asset pools for proposer and counterparty.
4. Update proposal submission and Playwright coverage.
5. Validate with lint, frontend tests, backend tests, and Playwright.

## Open Questions

- Whether a later slice should also replace cash inputs with stepper controls or preset amounts.
- Whether blocked properties should later show deeper reasons such as mortgage follow-up implications.