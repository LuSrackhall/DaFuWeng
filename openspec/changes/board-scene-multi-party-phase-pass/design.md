## Context

The previous board passes improved roll reveal, consequence readability, and turn handoff, but the board still relies too heavily on surrounding UI to explain auction, trade response, and deficit recovery.

This pass focuses on multi-party phase focus inside the board scene without introducing any new gameplay phase or action surface.

## Goals / Non-Goals

**Goals:**
- Explain auction, trade response, and deficit recovery directly inside BoardScene.
- Make the current decision owner and affected counterpart readable at a glance.
- Surface the current pressure source without replacing room-shell actions.
- Keep all additions non-blocking and semantic-first.

**Non-Goals:**
- No backend or contract changes.
- No new buttons or clickable board hotspots.
- No expansion to all turn states in one pass.
- No room-shell redesign or action-panel rewrite.

## Decisions

### 1. Introduce a dedicated BoardPhaseFocusCue

GamePage will map authoritative phase state into a dedicated board cue for `awaiting-auction`, `awaiting-trade-response`, and `awaiting-deficit-resolution`.

Why:
- These stages have stable semantics but higher social pressure than ordinary stage cues.

### 2. Render phase focus as a board-local, read-only panel

BoardScene will render a compact phase focus panel inside the board scene.

Why:
- The board should explain pressure and ownership without creating a new action layer.

### 3. Highlight active and affected players without implying extra action rights

The board will emphasize the current decision owner and the affected counterpart with different strengths.

Why:
- Multi-party stages are easiest to misread when all players look equally active.

### 4. Extend semantic summaries for phase focus validation

The board host aria summary will append concise phase focus context.

Why:
- This gives automation and assistive technologies a stable truth source for multi-party phase understanding.

## Risks / Trade-offs

- [Another board overlay could compete with existing handoff and consequence layers] -> Acceptable because the panel is compact and semantic-first.
- [Only three pressure stages are covered] -> Acceptable because this pass intentionally prioritizes the highest-friction multi-party states.
- [Player highlighting grows more layered] -> Acceptable because primary and secondary emphasis are kept distinct and non-interactive.

## Validation Strategy

1. Run frontend lint.
2. Re-run the clean Playwright suite.
3. Guard auction, trade response, and deficit phase focus summaries through e2e semantic assertions.