## Why

Decks are now real, but most cards still resolve through a narrow effect set. The game needs richer deterministic card families that can chain into landing logic and deficit recovery.

## What Changes

- Add relative movement cards and nearest railway targeting.
- Add bank payment cards and repair-fee cards that can enter deficit recovery.
- Add player-count bonus cards that scale by active opponents.
- Keep all card effects replayable through existing room events.

## Impact

- Backend card definitions and resolution pipeline
- Shared board sample state and frontend projection reasoning
- Integration coverage for chained movement and card deficits
