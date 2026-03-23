## Why

The room result system is now functional, but it still over-repeats information across the board, side rail, and primary action anchor.

Mobile decision trays also remain too close to stacked desktop cards, which slows single-hand play during high-pressure phases.

## What Changes

- Make recent result cards the single full-result surface while keeping the primary action anchor focused on current decision and consequence.
- Increase first-glance separation between neutral and success result treatments.
- Add a more contextual unsold-auction result treatment.
- Refine the mobile primary action tray into a clearer single-hand decision surface.
- Add end-to-end coverage for unsold auction result semantics.

## Capabilities

### New Capabilities
- None.

### Modified Capabilities
- `web-game-client`: Result feedback now has clearer hierarchy, clearer neutral/success differentiation, and a more purpose-built mobile decision tray.

## Impact

- Affected code: room result feedback mapping, board HUD presentation, room side rail hierarchy, mobile primary action tray styling, Playwright result coverage.
- APIs and persistence: no backend, protocol, or persistence changes.
- Systems: frontend presentation only.