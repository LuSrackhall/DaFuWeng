## Context

The contextual action surface fixed the main task for normal turns, jail decisions, and property decisions. The next rough edge is that optional tools still appear fully expanded below that surface.

This slice specifically targets optional normal-turn tools:

1. Trade drafting.
2. Property development.

## Goals / Non-Goals

**Goals:**
- Keep the main action surface visually dominant during normal turns.
- Move optional turn tools into a default-collapsed shelf.
- Preserve enough collapsed-state summary so players know whether tools are available.
- Keep the implementation frontend-only.

**Non-Goals:**
- No redesign of auction, trade response, deficit recovery, jail, or property-decision stage cards.
- No backend or protocol changes.
- No new persistent UI preferences for remembering shelf state across sessions.

## Decisions

### 1. Only normal-turn optional tools go into the shelf

Trade drafting and property development move into the shelf, but only when the room is in a normal roll state and no dedicated stage already owns the interaction.

Why:
- These tools are optional and strategic, not blocking.
- Dedicated stage cards should keep full visual priority.

### 2. The shelf stays collapsed by default

Players must explicitly expand it.

Why:
- The current problem is visual competition with the primary action.
- A collapsed default preserves discoverability without letting optional tools dominate.

### 3. Collapsed state must still communicate availability

The collapsed shelf shows whether trade drafting is available and how many developable properties exist.

Why:
- Hidden tools should still be discoverable.
- Players should not need to expand blindly.

## Risks / Trade-offs

- [Players may overlook optional tools] -> Mitigated by an availability summary in the collapsed state.
- [One more click before using strategy tools] -> Acceptable because these are optional actions and should come after the main action.
- [Trade drafting feels less prominent] -> Intentional during normal turns; pending trade response still keeps its own dominant stage card.

## Migration Plan

1. Add OpenSpec deltas for a normal-turn tools shelf.
2. Refactor normal-turn trade drafting and property development into a collapsible container.
3. Add a collapsed-state summary for available tools.
4. Add one Playwright scenario for default-collapsed behavior.
5. Validate with lint and end-to-end coverage.