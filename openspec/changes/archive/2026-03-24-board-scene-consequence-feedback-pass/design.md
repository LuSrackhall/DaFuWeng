## Context

The previous two board passes improved the entry into a turn and the clarity of movement, but the board still relies too heavily on text outside the play surface to explain what a landing caused.

This pass focuses on four high-value consequence types:
- property-purchased
- rent-charged
- tax-paid
- player-jailed

## Goals / Non-Goals

**Goals:**
- Explain key landing consequences directly inside BoardScene.
- Improve spectator readability without adding new interaction surfaces.
- Provide a stable semantic summary path that automated tests can guard.
- Keep all consequence feedback read-only and authoritative.

**Non-Goals:**
- No new rules or choices.
- No new backend or projection protocol.
- No room shell changes.
- No expansion to trade, auction, mortgage, card, or bankruptcy consequence families.

## Decisions

### 1. Introduce a dedicated BoardConsequenceCue

GamePage will map authoritative recent events into a dedicated scene cue rather than overloading transitionHint or resultFeedback.

Why:
- This keeps movement/reveal logic separate from landing consequence explanation.

### 2. Render a consequence ribbon below the central board broadcast layer

BoardScene will render a short, non-interactive consequence ribbon below the center HUD.

Why:
- This keeps the message on the board without blocking tile readability or the main stage text.

### 3. Extend aria summaries instead of testing canvas pixels

The board host aria-label will append concise consequence summaries for the four supported consequence families.

Why:
- This creates a stable automated testing surface and helps assistive technologies understand the consequence state.

### 4. Keep the cue authoritative and read-only

The cue only describes an already confirmed outcome and never introduces new actions or reaction windows.

Why:
- The board must explain a result, not invent a new gameplay step.

## Risks / Trade-offs

- [More semantic detail in aria labels increases string length] -> Acceptable because the added content is concise and scoped to four key event types.
- [A board ribbon could feel redundant with the side rail] -> Acceptable because its job is immediate consequence readability, not full explanation.
- [Only four consequence types are supported] -> Acceptable because this pass intentionally prioritizes the highest-value landing outcomes.

## Validation Strategy

1. Run frontend lint.
2. Re-run the clean Playwright suite.
3. Guard the four supported consequence summaries through e2e semantic assertions.