## Why

The frontend build still emits a large chunk warning because the room scene and heavy runtime dependencies are bundled too eagerly.

This makes the lobby entry heavier than necessary and weakens deployment confidence.

## What Changes

- Split the room page behind route-level lazy loading.
- Separate heavy vendor chunks such as Pixi and React-related runtime code.
- Keep a lightweight router fallback so route chunk loading does not flash blank content.

## Capabilities

### New Capabilities
- None.

### Modified Capabilities
- `web-game-client`: The frontend entry and room route now use chunked delivery instead of a monolithic bundle.

## Impact

- Affected code: frontend router, main router provider fallback, Vite build config.
- APIs and persistence: no backend or protocol changes.
- Systems: frontend build and delivery only.