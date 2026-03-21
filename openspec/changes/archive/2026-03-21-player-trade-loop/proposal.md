## Why

The room now has enough asset types to support a minimal multiplayer trade loop. Without a formal server-authoritative trade flow, players cannot exchange cash, properties, or get-out cards safely.

## What Changes

- Add one pending two-player trade offer at a time.
- Support offering and requesting cash, properties, and held get-out cards.
- Add accept and reject responses with authoritative atomic settlement.
- Prevent trading properties whose color groups still contain improvements.

## Impact

- Backend room protocol and asset transfer rules
- Frontend trade proposal and response panel
- Projection replay, integration tests, and Playwright multiplayer coverage
