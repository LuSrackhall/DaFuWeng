## Context

The trade flow already has clear structure, but some of its messaging still uses backend-oriented words such as formal, atomic, authority, and process. Those words are defensible internally, but they are not the strongest fit for a premium multiplayer board-game surface.

This slice focuses on tone, not behavior.

## Goals / Non-Goals

**Goals:**
- Make trade copy feel like game-host guidance instead of system-status narration.
- Cover the most visible trade-loop moments: entry, confirmation, waiting, and results.
- Preserve current interaction structure and automated flow coverage.

**Non-Goals:**
- No protocol or room-state changes.
- No layout or visual hierarchy redesign.
- No global copy rewrite outside the trade loop.

## Decisions

### 1. Prefer player-action phrasing over backend-state phrasing

Trade copy should answer three questions quickly: who acts now, what they can do, and what happens next.

Why:
- Those are the only questions players need in the moment.
- This keeps the copy shorter and more playable.

### 2. Keep the same content model, change the voice

The same warnings and results remain, but are phrased in a more human and game-like way.

Why:
- The existing information architecture is already working.
- This slice should avoid creating layout churn.

### 3. Remove internal engineering terms from player-facing trade copy

Words like atomic, authority, formal, and process should not appear in the core trade loop.

Why:
- They describe implementation guarantees, not player experience.
- They weaken the premium board-game tone.

## Risks / Trade-offs

- [Copy becomes slightly less literal to the implementation] -> Acceptable because the player only needs the gameplay consequence, not the transport semantics.
- [Existing tests may need small string updates] -> Acceptable because behavior remains unchanged and browser coverage will be rerun.

## Migration Plan

1. Add OpenSpec deltas for the trade copy-tone pass.
2. Update trade-loop player copy in the room page and result summaries.
3. Adjust browser assertions if exact wording changes.
4. Validate with lint and Playwright.
