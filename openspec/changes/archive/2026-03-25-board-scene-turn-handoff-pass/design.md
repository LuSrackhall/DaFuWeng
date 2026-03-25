## Context

The previous board passes improved roll reveal, movement readability, and landing consequence feedback, but the scene still hard-cuts from one completed turn into the next active stage.

This pass focuses on authoritative turn handoff readability and spectator clarity without introducing any new gameplay phase.

## Goals / Non-Goals

**Goals:**
- Show a concise turn handoff bridge when the authoritative turn changes.
- Let the previous result visually step back while the next player takes the stage.
- Keep spectators aware of who now owns action and what the next phase is.
- Preserve all existing room-shell, button-name, and board host contracts.

**Non-Goals:**
- No new turn phase or gameplay choice.
- No backend or contract changes.
- No expansion to trade, auction, or bankruptcy-specific handoff choreography.
- No camera-heavy cinematic transitions.

## Decisions

### 1. Introduce a dedicated BoardTurnHandoffCue

GamePage will map authoritative `turn-advanced` events into a dedicated board cue.

Why:
- Turn ownership changes are semantically different from movement and consequence cues.

### 2. Keep handoff read-only and non-blocking

The handoff bridge only explains who now owns the stage and what the incoming phase is.

Why:
- The board must explain state changes, not create a new action surface.

### 3. Dim previous results when handoff is active

When a handoff cue is present, the previous result banner and consequence ribbon step back visually.

Why:
- This creates a clean bridge from one resolved turn into the next player without hard-cutting context.

### 4. Extend semantic summaries for handoff validation

The board host aria summary will append a concise handoff summary.

Why:
- This gives automation and assistive technologies a stable truth source for handoff state.

## Risks / Trade-offs

- [Handoff messaging could overlap with existing stage messaging] -> Acceptable because the cue is short and visually separate from the main card.
- [Only `turn-advanced` is covered] -> Acceptable because this pass intentionally focuses on the highest-confidence ownership transition.
- [Previous results remain visible but dimmed] -> Acceptable because it preserves continuity without delaying interaction.

## Validation Strategy

1. Run frontend lint.
2. Re-run the clean Playwright suite.
3. Guard turn handoff summaries through e2e semantic assertions.