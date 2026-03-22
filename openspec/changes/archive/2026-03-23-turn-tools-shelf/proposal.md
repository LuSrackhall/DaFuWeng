## Why

The room page now gives routine turn actions a clearer primary action surface, but optional turn tools still compete for attention. In a normal roll state, trade drafting and property development remain fully expanded, which makes the page feel busier than the new action hierarchy intends.

Players should notice the required move first, then choose whether to open deeper strategy tools.

## What Changes

- Move optional normal-turn tools into a default-collapsed turn-tools shelf.
- Keep trade drafting and property development available, but behind an explicit secondary interaction.
- Show a collapsed summary that still tells the acting player whether trade and development tools are available.
- Extend browser coverage with a scenario that verifies the shelf stays collapsed by default and reveals the tools when expanded.

## Capabilities

### New Capabilities
- None.

### Modified Capabilities
- `web-game-client`: The room page now defers optional normal-turn tools behind a collapsible shelf so the primary action remains dominant.

## Impact

- Affected code: frontend room page layout, responsive styles, and frontend end-to-end coverage.
- APIs and persistence: no backend protocol or storage changes are required.
- Systems: normal-turn action hierarchy on the web room page.
