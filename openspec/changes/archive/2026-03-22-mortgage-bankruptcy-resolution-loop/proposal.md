## Why

Once a player enters deficit, the room needs a minimal authoritative way to recover or exit them from the game. Without that, tax and later forced payments still dead-end the room.

This change adds the minimum recovery tools: mortgage a property for cash, or declare bankruptcy if the debt cannot or should not be covered.

## What Changes

- Add authoritative mortgage commands for owned unmortgaged properties.
- Mark mortgaged properties in snapshots and prevent them from charging rent.
- Auto-settle pending deficit after enough mortgage cash is raised.
- Add a minimal bankruptcy command that removes the player from normal play and advances the room.
