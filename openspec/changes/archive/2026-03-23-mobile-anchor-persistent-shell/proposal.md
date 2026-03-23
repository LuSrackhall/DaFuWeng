## Why

The room primary action anchor works well on desktop, but mobile currently demotes it back into the normal document flow.

On narrow screens that means the most important decision surface can scroll away behind the board and supporting cards.

## What Changes

- Keep the primary action anchor persistently visible on mobile as a floating bottom tray.
- Reserve enough page space so the tray does not cover the last interactive content.
- Add mobile Playwright coverage that confirms the anchor stays visible and clickable after scrolling.

## Capabilities

### New Capabilities
- None.

### Modified Capabilities
- `web-game-client`: Mobile room pages keep the primary action anchor continuously visible while preserving board readability.

## Impact

- Affected code: mobile room layout styling and Playwright mobile coverage.
- APIs and persistence: no backend, protocol, or persistence changes.
- Systems: frontend presentation only.