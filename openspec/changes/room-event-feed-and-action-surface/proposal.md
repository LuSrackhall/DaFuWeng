## Why

The room page now has a stronger board stage and a stable primary action anchor, but players still need to scan too many overlapping surfaces to understand the room.

The main problems are:

- the overview card, stage cards, and primary action anchor still repeat parts of the same guidance
- recent events are still treated like diagnostics instead of a normal player-facing room surface
- auction input is valid but still feels like a generic text field instead of a focused bidding control
- players cannot tune how dense the recent event feed should be for their own reading style

This slice should make the room easier to read without changing any authoritative rules, room protocol, or persistence.

## What Changes

- Restructure the room rail so the overview card, stage cards, and primary action anchor no longer compete for the same information hierarchy.
- Promote recent events into a player-facing event feed instead of keeping them only inside the diagnostics drawer.
- Add local event-feed display settings for ordering, near-event placement, numbering direction, and visible count.
- Refine the auction input experience so the minimum valid bid, quick-bid path, and invalid-input feedback are easier to understand.
- Add frontend unit and Playwright coverage for the new room-surface contract.

## Capabilities

### New Capabilities
- None.

### Modified Capabilities
- `web-game-client`: The room page now presents a cleaner action hierarchy, a formal recent-event feed, and configurable event-feed display behavior.

## Impact

- Affected code: frontend room-page layout, helper selectors, styles, and browser coverage.
- APIs and persistence: no backend protocol or storage changes are required; event-feed settings remain local to the client.
- Systems: room-page readability, auction input experience, and reconnect-friendly event visibility.