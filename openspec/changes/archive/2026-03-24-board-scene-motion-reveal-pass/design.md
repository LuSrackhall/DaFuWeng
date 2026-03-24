## Context

The board now has a stronger roll-stage entrance, but the actual roll payoff inside the scene is still underdeveloped.

Players can read the final state, but the board does not yet clearly explain the transition from authoritative dice result to token movement to landing consequence.

## Goals / Non-Goals

**Goals:**
- Visually explain a confirmed roll inside the board scene.
- Move a single token stepwise when the authoritative state clearly proves a safe forward path.
- Hand off from movement to landing highlight and result state without blocking semantics.
- Preserve all existing room-shell, button-name, and board aria contracts.

**Non-Goals:**
- No rule changes.
- No protocol or projection-schema changes.
- No room-shell restructure.
- No camera-heavy cinematic system.
- No speculative or client-predicted dice animation.

## Decisions

### 1. Use a structured board transition hint

GamePage will pass a structured transition hint into BoardScene using existing authoritative data such as snapshotVersion, eventSequence, event type, acting player, and dice total.

Why:
- This is more stable than reverse-engineering animation triggers from display strings.

### 2. Only animate when the authoritative path is provable

BoardScene will compare the previous and next player positions.

If exactly one player moved and a forward path of `diceTotal` steps lands on the final authoritative tile, the scene will animate stepwise movement. Otherwise it will snap directly to the final state.

Why:
- This prevents visual ambiguity during reconnects, catch-up snapshots, special teleports, or multi-player changes.

### 3. Keep scene animation non-blocking

DOM semantics, current actions, and authoritative result cards remain immediate. Scene animation only explains the already confirmed result.

Why:
- The board should reinforce trust, not delay interaction or state understanding.

### 4. Preserve public UI contracts

This pass will not change:
- primary button accessible names
- room shell structure
- board host class name
- board host aria-label prefix model

Why:
- Clean e2e already relies on those contracts and they are outside this slice.

## Risks / Trade-offs

- [Animating via full scene redraw is not the final Pixi architecture] -> Acceptable for this pass because the motion scope remains small and the board contract stays stable.
- [Some authoritative updates will intentionally snap instead of animate] -> Acceptable because correctness and trust are more important than motion completeness.
- [Dice reveal could still feel too subtle on some screens] -> Acceptable for now because this pass prioritizes clarity and reliability over cinematic excess.

## Validation Strategy

1. Run frontend lint.
2. Re-run the clean Playwright suite unchanged.
3. Manually verify that movement only animates on safe roll-derived transitions.