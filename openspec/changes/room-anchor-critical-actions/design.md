## Context

The stable action anchor already improves orientation, but it still fails its own promise in the two states where players need it most: auction and deficit recovery.

Players can understand what to do, but they still have to scan down the page for the decisive controls.

## Goals / Non-Goals

**Goals:**
- Let auction players submit or pass directly from the anchor.
- Let deficit actors take the shortest recovery action directly from the anchor.
- Keep dense comparison data and fallback options in detailed cards below.

**Non-Goals:**
- No rule, authority, or protocol changes.
- No full migration of every deficit asset option into the anchor.
- No redesign of all detailed stage cards.

## Decisions

### 1. Put decisive auction controls in the anchor

The anchor should expose quick auction bid selection, direct bid submission, and pass.

Why:
- Auction is time-sensitive and should not require scanning a second action surface.

### 2. Put the shortest deficit path in the anchor

The anchor should expose the best immediate mortgage option and bankruptcy.

Why:
- Deficit recovery should always offer one shortest path forward before forcing the player into detailed comparison.

### 3. Keep detailed cards as comparison and context surfaces

Stage cards below keep actor, lot, debt source, alternative assets, and blocked options.

Why:
- Players still need detail, but detail should not block the first valid action.

## Risks / Trade-offs

- [The anchor becomes denser in high-pressure states] -> Acceptable because these are exactly the states where direct controls matter most.
- [Detailed cards still keep some alternative controls for recovery assets] -> Acceptable because fallback comparisons remain useful.

## Migration Plan

1. Add OpenSpec artifacts for high-pressure anchor actions.
2. Add auction controls to the primary anchor.
3. Add best-path deficit controls to the primary anchor.
4. Demote duplicate decisive controls in detailed cards.
5. Add Playwright assertions for auction and deficit anchor actions.