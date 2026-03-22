## Why

The room page now has stronger mobile reading order, but the current action area still behaves like a generic control tray. Players often see multiple disabled buttons at once, even though the room is only waiting for one real decision.

That makes normal turns, jail turns, and property decisions feel more mechanical and less readable than the rest of the room-stage surfaces.

## What Changes

- Turn the current action area into a contextual action surface driven by the current authoritative room state.
- Show only the actions that are relevant to the current step for normal turns, jail decisions, and property decisions.
- Replace irrelevant disabled buttons with explicit waiting or read-only guidance.
- Extend browser coverage with a room-page scenario that validates jail decisions no longer share space with unrelated actions.

## Capabilities

### New Capabilities
- None.

### Modified Capabilities
- `web-game-client`: The room page now presents a more contextual current-action surface for normal turns and non-stage decisions.

## Impact

- Affected code: frontend room page action surface, styles, and frontend end-to-end coverage.
- APIs and persistence: no backend protocol or storage changes are required.
- Systems: web room-page readability for routine turn actions.