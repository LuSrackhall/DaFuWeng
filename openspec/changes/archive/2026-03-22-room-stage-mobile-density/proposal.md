## Why

The room page now has strong stage surfaces for auctions, trades, and deficit recovery, but mobile density still lags behind desktop quality. On smaller screens the room overview often reaches the top before the current stage, dual-column stage content stacks too late, and key actions compete with too much secondary information.

That weakens one of the most important product promises: players should understand the current authoritative room step in seconds, even on a phone.

## What Changes

- Reorder the mobile room page so the current stage card outranks the overview card on narrow screens.
- Collapse stage internals into single-column mobile layouts for auction, trade, and deficit recovery.
- Reduce button, asset-chip, and drawer density so key actions remain readable without horizontal scrolling.
- Extend browser coverage with a mobile-viewport room-page smoke test.

## Capabilities

### New Capabilities
- None.

### Modified Capabilities
- `web-game-client`: The room page now prioritizes the current authoritative stage and key actions more clearly on mobile screens.

## Impact

- Affected code: frontend room page layout, responsive CSS, and frontend end-to-end coverage.
- APIs and persistence: no backend protocol or storage changes are required.
- Systems: mobile web readability for multiplayer room flows.
