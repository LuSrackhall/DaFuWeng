## Why

The room route loading shell now explains room entry clearly, but the in-page room sync state still falls back to loose subtitle copy.

That breaks the visual and informational handoff between route loading and page-level synchronization, especially on mobile.

## What Changes

- Productize the in-page room sync state into a dedicated room sync shell.
- Keep room identity, sync freshness, connection state, and action availability visible while page sync is incomplete.
- Add a mobile-specific slow-data regression that confirms the in-page sync shell becomes the first in-room state after the route shell disappears.

## Capabilities

### New Capabilities
- None.

### Modified Capabilities
- `web-game-client`: The room page now uses a productized in-page sync shell instead of loose loading subtitles.

## Impact

- Affected code: room page presentation, app styles, Playwright coverage.
- APIs and persistence: no backend or protocol changes.
- Systems: frontend presentation and regression coverage only.