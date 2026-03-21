## Context

The backend already enforces jail entry, but the release logic is still a single-button shortcut. The room needs a real jailed-turn state so turn order, anti-cheat validation, and reconnect behaviour remain coherent.

## Decisions

### 1. Jail uses an explicit decision phase
When the current player is jailed, the room enters `awaiting-jail-decision` instead of a generic roll state.

### 2. Jail attempts are persisted on the player
The authoritative snapshot stores how many failed jail attempts the player has made so refresh and restart stay deterministic.

### 3. Release methods are evented
Paying a fine, rolling doubles, and using a held release card each produce explicit events so clients can reconstruct the same state from the event stream.