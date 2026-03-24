## Context

Three user-facing issues now stand out more clearly after the reconnect and clean-e2e stabilization work:

1. The roll action still feels like a plain command button instead of the emotional start of a turn.
2. The board is visually compressed by adjacent room-state UI.
3. The Pixi center HUD carries too much persistent information and becomes visually crowded as the viewport tightens.

## Goals / Non-Goals

**Goals:**
- Make the roll phase feel like the ceremonial opening of a turn.
- Give the board more spatial priority than the information rail.
- Rework the board center overlay so it stays readable without center-stack crowding.
- Preserve clean e2e stability by keeping command semantics and primary test anchors intact.

**Non-Goals:**
- No backend, protocol, or rules changes.
- No camera choreography overhaul.
- No full information-architecture rewrite of the entire room page.
- No blocking animation that delays authoritative state application.

## Decisions

### 1. Use a stronger DOM action stage for the roll entrance

The active roll state keeps its existing command semantics and accessible button label, but gains a dedicated dice-stage treatment in the primary action anchor.

Why:
- This creates a clear sense of turn ownership without changing the command surface that clean e2e already relies on.

### 2. Increase board priority through layout ratio and panel compression

The room layout shifts more width to the board, while board-adjacent summary cards become lighter and more compact.

Why:
- The board should remain the first visual surface in a Monopoly game, while the rail acts as a supporting control and status layer.

### 3. Reduce the Pixi center HUD to a broadcast layer

The center HUD keeps only the most important scene-facing information: stage identity, result emphasis, concise supporting detail, and compact chips for action and dice.

Why:
- A smaller scene overlay is easier to keep readable, less likely to overlap visually, and better aligned with a premium board-game presentation.

### 4. Keep dice animation result-driven

The board animation responds to new authoritative result feedback instead of inventing or predicting dice outcomes.

Why:
- This preserves the existing authoritative model and avoids introducing misleading presentation states.

## Risks / Trade-offs

- [A lighter center HUD may reduce explanatory text inside the scene] -> Acceptable because the rail already carries the detailed context.
- [A stronger roll entrance may visually dominate if overdone] -> Mitigated by keeping the action-anchor copy concise and limiting motion scope.
- [Scene animation could threaten test stability if it mutates command semantics] -> Mitigated by preserving the existing button label, command flow, and board aria summary model.

## Validation Strategy

1. Preserve current TypeScript lint coverage.
2. Re-run the clean Playwright suite after the first batch.
3. Manually verify wide desktop, narrow desktop, and mobile widths for board readability and center-HUD non-overlap.