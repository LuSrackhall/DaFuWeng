## Why

The repository already validates 4-player real-room refresh recovery for a seated but non-acting page. It still lacks direct evidence that the acting player can refresh during their own turn and continue the same authoritative action flow.

That missing proof leaves a gap in the highest-risk refresh path for multiplayer continuity.

## What Changes

- Add Playwright coverage for a 4-player real room where the current acting player refreshes and continues the same turn.
- Capture the slice in OpenSpec artifacts.

## Capabilities

### Modified Capabilities
- `realtime-projection-recovery`: adds current-turn refresh recovery evidence in a 4-player real-room path.

## Impact

- Affected code: frontend Playwright tests and OpenSpec artifacts.
- Runtime behavior: unchanged.
- Product confidence: stronger evidence that refresh recovery preserves active-turn action rights.