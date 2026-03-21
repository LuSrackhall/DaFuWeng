## Context

The backend is already authoritative for property and cash rules, but special tiles are still mostly placeholders. This slice adds the smallest possible deterministic card and jail model without introducing full decks, chained effects, or advanced jail strategy.

## Goals / Non-Goals

**Goals:**
- Resolve chance and community tiles through deterministic backend card effects.
- Send players to jail from the `去监狱` tile.
- Require jailed current players to pay a fixed fine before rolling again.
- Keep the state reconnect-safe and visible through snapshots and events.

**Non-Goals:**
- Randomized or shuffled card decks.
- Double-roll escape, get-out-of-jail cards, or multi-turn jail strategy.
- Bankruptcy flows caused by fines.

## Decisions

### 1. Card effects are deterministic primitives
Chance and community tiles resolve to fixed backend-owned effects so tests and reconnect behavior remain deterministic.

### 2. Jail is a turn gate, not a full subgame
When a player's turn starts in jail, the room enters `awaiting-jail-release` until that player pays the fixed fine and returns to `awaiting-roll`.

### 3. The backend remains the only effect resolver
The frontend renders card and jail outcomes from authoritative snapshots and events. It does not infer tile effects locally.