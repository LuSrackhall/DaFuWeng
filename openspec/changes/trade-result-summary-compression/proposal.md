## Why

Accepted and rejected trade result cards now recover reliably, but their dense line-by-line breakdown still makes them slower to scan than they need to be.

This slice compresses the result summary so players can confirm the outcome faster without losing the key facts.

## What Changes

- Compress empty trade result categories at the projection layer.
- Add concise per-side summaries to accepted and rejected trade result cards.
- Keep detailed lines visible but visually secondary.

## Capabilities

### New Capabilities
- None.

### Modified Capabilities
- `web-game-client`: Trade accepted and rejected result cards now prioritize compact, high-signal summaries over repetitive empty categories.

## Impact

- Affected code: frontend projection, result-card rendering, and projection test coverage.
- APIs and persistence: no backend or protocol changes are required.
- Systems: accepted and rejected trade result cards on the room page.