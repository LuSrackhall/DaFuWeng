## Context

Card spaces should no longer behave as anonymous tiles. The authoritative room needs to know which card was drawn, where it moved after use, and whether it is currently held by a player.

## Decisions

### 1. Deck state is persisted in-room
Each room stores separate draw and discard piles for chance and community decks.

### 2. Held release cards leave the discard cycle temporarily
Get-out-of-jail cards are removed from circulation while held by a player and are returned to discard only after use.

### 3. Card events include card identity and disposition
Clients reconstruct deck-driven state from explicit event metadata rather than inferring behaviour from tile labels alone.