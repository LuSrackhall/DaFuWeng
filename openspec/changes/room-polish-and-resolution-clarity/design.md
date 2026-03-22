## Context

The previous change made the multiplayer MVP real: server-issued room sessions, real room creation and joining, command authorization, and refresh-safe recovery. That solved the fake-playable problem, but two high-friction moments remain:

- the waiting room does not clearly communicate room identity, player seat status, and exact start blockers
- the deficit and bankruptcy path exposes raw state but not a convincing explanation of cause, options, and outcome

The current backend protocol already contains the required truth: pendingActionLabel, pendingPayment, player state, room state, and recent events. The gap is mostly in frontend projection and presentation quality, not in backend orchestration.

## Goals / Non-Goals

**Goals:**
- Make the waiting room feel like a clear pre-game stage instead of a generic state dump.
- Present deficit and bankruptcy as an understandable resolution flow for both the acting player and observers.
- Keep the implementation frontend-first and avoid changing the authoritative room contract unless a small label adjustment is absolutely necessary.
- Preserve reconnect and refresh behavior so the enhanced clarity survives snapshot reloads and streamed updates.

**Non-Goals:**
- No new backend rule branches, no new room protocol envelopes, and no persistence schema changes.
- No Pixi scene rebuild or heavy motion system.
- No expansion into advanced bankruptcy rules such as bank re-auction, multi-creditor ordering, or forced liquidation ordering.
- No overhaul of the global lobby or room discovery flow.

## Decisions

### 1. Build a stage-oriented summary layer on top of the existing projection

The frontend will derive a small set of human-readable room stage summaries from the existing projection snapshot instead of rendering raw room fields directly.

Why:
- It keeps backend contracts stable.
- It centralizes explanation logic so multiple room states do not need separate ad hoc JSX fragments everywhere.

Alternative considered:
- Emitting new server-provided “display model” fields. Rejected because the current authoritative payload already contains enough information, and adding presentation-specific protocol fields would increase coupling.

### 2. Use a dedicated waiting-room stage card rather than sprinkling more labels into the sidebar

The waiting room will get a focused summary card showing room code, host, seat list, current player identity, minimum start condition, and why the host can or cannot begin.

Why:
- Waiting-room clarity is primarily a hierarchy problem, not a data availability problem.
- A single stage card gives the pre-game state a readable center of gravity.

Alternative considered:
- Only adding more status cards. Rejected because it would keep the waiting room visually fragmented.

### 3. Treat deficit and bankruptcy as a single resolution experience

The room page will present pendingPayment, mortgage candidates, and bankruptcy consequences in one contiguous resolution area. The acting player sees available recovery actions; other players see why the room is paused and what outcome is pending.

Why:
- Players think in one narrative: “I owe money, can I recover, what if I fail?”
- Splitting this across unrelated widgets makes the state machine harder to trust.

Alternative considered:
- Keeping mortgage and bankruptcy controls separate from the pending payment explanation. Rejected because it forces the player to infer the relationship between controls and debt state.

### 4. Shift presentation highlight priority from generic turn focus to stage focus

The current presentation layer highlights the current turn player tile. During waiting-room and deficit states, the UI should instead highlight the most relevant stage subject such as the acting debtor or the debt source tile.

Why:
- It makes the board and side panel tell the same story.
- It uses existing board visuals without requiring a larger scene rewrite.

Alternative considered:
- Leaving highlight behavior unchanged. Rejected because it misses a cheap but valuable explanatory aid.

## Risks / Trade-offs

- [Too much summary text turns the room page into another debug panel] -> Keep the new stage cards short, outcome-focused, and role-aware.
- [Derived explanation logic drifts from real backend state] -> Derive all summary text from existing projection fields and cover the mapping with Vitest.
- [Adding more sidebar sections hurts mobile readability] -> Reuse the existing card layout and stack the new sections responsively instead of widening the page.

## Migration Plan

1. Add OpenSpec delta specs for waiting-room clarity, deficit readability, and bankruptcy settlement presentation.
2. Add projection-derived summary helpers and stage-focused highlighting.
3. Refactor the room page to render stage cards for waiting-room and resolution states.
4. Update CSS and tests.
5. Validate with lint, frontend tests, backend tests, and Playwright, then push the resulting commit.

## Open Questions

- Whether the waiting room should later expose explicit ready toggles once that mechanic is implemented for more than the current host-centric MVP.
- Whether bankruptcy should later gain a dedicated end-of-turn recap modal once richer scene animation exists.