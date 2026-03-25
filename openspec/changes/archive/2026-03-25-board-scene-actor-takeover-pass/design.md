## Context

Previous passes taught the board how to explain closure and resumed next steps, but the unresolved side of high-pressure gameplay still lacked a stable “who currently owns the table” signal.

This pass focuses on unresolved pressure states where the room has not yet resumed the normal loop.

## Goals / Non-Goals

**Goals:**
- Explicitly show who is currently taking over the board during supported unresolved pressure states.
- Add concise chain briefs for supported unresolved jail, deficit, and player-creditor bankruptcy situations.
- Preserve one dominant actor and avoid creating a new gameplay phase.
- Keep all additions semantic-first and read-only.

**Non-Goals:**
- No backend or contract changes.
- No new gameplay phases or client-side state machines.
- No migration of interactive controls into BoardScene.
- No attempt to replay full settlement histories inside the board.

## Decisions

### 1. Introduce a dedicated BoardActorTakeoverCue

GamePage will derive a dedicated takeover cue for supported unresolved pressure states.

Why:
- “Who currently owns this pressure loop” is different from turn handoff and different from closure.

### 2. Extend the existing BoardPhaseFocusCue with a concise brief label

BoardScene will keep using phase focus for unresolved pressure but add a short chain-brief line.

Why:
- This preserves the current cue hierarchy while making unresolved chains easier to understand.

### 3. Treat player-creditor bankruptcy transfer as a receiver-led takeover when appropriate

When a supported bankruptcy transfer points to another player, the receiver becomes the dominant board actor for the transfer cue.

Why:
- The player-to-player transfer is a visible power shift and should read that way.

### 4. Keep unresolved pressure distinct from closure

Supported unresolved chain briefs will only appear while the room has not yet resumed a normal stage.

Why:
- The board must not claim a chain has closed before the authoritative state has actually moved on.

## Risks / Trade-offs

- [Takeover cues could compete with handoff cues] -> Acceptable because takeover only appears when handoff is absent and pressure is still unresolved.
- [Chain briefs could become too wordy] -> Acceptable because the brief is restricted to one concise supporting line.
- [Bankruptcy transfer emphasis could look like a new phase] -> Acceptable because it remains read-only and is tied to existing authoritative events.

## Validation Strategy

1. Run frontend lint.
2. Re-run the clean Playwright suite.
3. Guard jail hold takeover, unresolved economic-chain brief, and player-creditor bankruptcy transfer takeover through e2e semantic assertions.