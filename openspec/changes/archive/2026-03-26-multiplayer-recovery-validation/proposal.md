## Why

The repository now proves 3-player and 4-player room creation, start, and short turn progression, but it still lacks focused evidence for two high-risk multiplayer recovery paths.

Those gaps are:
- a 3-player continued game where bankruptcy resolves and the room keeps running
- a 4-player real room where a seated player refreshes and recovers the same authoritative seat and turn state

## What Changes

- Add backend integration coverage for 3-player continued-game bankruptcy handoff.
- Add Playwright coverage for 4-player real-room refresh recovery.
- Capture the slice in OpenSpec artifacts.

## Capabilities

### Modified Capabilities
- `bankruptcy-settlement-loop`: continued-game bankruptcy handoff is now covered in a 3-player integration path.
- `realtime-projection-recovery`: 4-player real-room refresh recovery now has browser evidence.

## Impact

- Affected code: backend integration tests, frontend Playwright tests, OpenSpec artifacts.
- Runtime behavior: unchanged.
- Product confidence: stronger evidence that multiplayer games survive bankruptcy continuation and browser refresh recovery.