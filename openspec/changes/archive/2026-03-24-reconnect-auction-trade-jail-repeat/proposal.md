## Why

Reconnect success narration now covers ordinary turns, property decisions, and deficit recovery, but three decision-heavy branches still fall back to generic wording: auctions, trade responses, and jail decisions.

The suite also lacks a regression that proves a second reconnect cannot accidentally reuse the first reconnect's stale narrative.

## What Changes

- Extend reconnect recovery narration to auction, trade response, and jail decision phases.
- Add reconnect regressions for those three phases.
- Add a repeated-disconnect regression to prove the latest recovery context replaces the previous one.

## Capabilities

### New Capabilities
- None.

### Modified Capabilities
- `web-game-client`: reconnect recovery narration now explains more decision-heavy phases and guards against stale repeated reconnect context.

## Impact

- Affected code: reconnect recovery narrative generation, Playwright reconnect regressions, OpenSpec artifacts.
- APIs and persistence: no backend or protocol changes.
- Systems: frontend presentation and regression coverage only.