## Context

The room route is now lazy loaded, but the fallback shell only displays the product title and a generic loading sentence.

That leaves players without enough confidence during cold loads, refreshes, or spectator entry.

## Goals / Non-Goals

**Goals:**
- Make the room loading shell feel like a room-entry transition.
- Show deterministic information only: room id, sync stage, entry mode, and room-stage expectation.
- Prove that route loading and data loading have distinct user-facing states.

**Non-Goals:**
- No fake board state, fake player state, or pre-rendered gameplay outcome.
- No backend loading endpoint changes.
- No deep navigation redesign.

## Decisions

### 1. Loading shell shows deterministic room-entry context

The fallback will display room id, sync phases, entry mode, and expected permission level.

Why:
- This gives players confidence without inventing state that has not arrived yet.

### 2. Spectator and player entry use different expectation copy

The shell should explain whether the user is restoring a room session or entering as read-only.

Why:
- The most important question differs by entry mode.

### 3. Slow-route and slow-data states must be validated separately

Route-chunk delay and room-snapshot delay should surface different loading states.

Why:
- Otherwise the system can regress while tests still pass by observing the wrong layer.

## Risks / Trade-offs

- [The loading shell adds more copy before the real room page] -> Acceptable because it replaces uncertainty with explicit entry context.
- [Tests rely on delaying specific chunk requests] -> Acceptable because this is the most direct way to validate route-level fallback behavior in preview builds.

## Migration Plan

1. Add OpenSpec artifacts for the room loading shell and slow-network validation.
2. Productize the room route loading shell.
3. Add Playwright coverage for delayed room chunk loading.
4. Add Playwright coverage for delayed room snapshot loading.
5. Verify lint and e2e remain green.