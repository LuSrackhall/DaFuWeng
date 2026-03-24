## Why

Local end-to-end validation still depends on the default Playwright lane, which reuses existing servers and assumes the default API base URL.

That makes clean-room local validation harder to reproduce and can produce misleading results when frontend preview and backend isolation ports diverge.

## What Changes

- Parameterize Playwright frontend and backend ports, API base URL, PocketBase data path, fixed dice, and server reuse behavior.
- Add a formal clean e2e script for isolated local validation.

## Capabilities

### New Capabilities
- `web-game-client`: developers can run an isolated local clean e2e lane without relying on temporary external Playwright configs.

### Modified Capabilities
- `web-game-client`: the default Playwright config now supports environment-driven execution profiles.

## Impact

- Affected code: frontend Playwright configuration and frontend package scripts.
- APIs and persistence: no gameplay or protocol changes.
- Systems: local validation tooling only.