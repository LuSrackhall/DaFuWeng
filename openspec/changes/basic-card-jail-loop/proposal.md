## Why

The authoritative loop now covers property decisions, rent, event streaming, and auctions. The next missing slice is the first non-property tile effect branch: deterministic cards and a minimal jail loop.

Without that, major board spaces still behave like placeholders and the room cannot represent a basic constrained-turn state where a player must resolve jail before rolling again.

## What Changes

- Add deterministic card effects for chance and community tiles using a minimal backend-owned effect set.
- Add authoritative go-to-jail resolution and a minimal jail release command.
- Persist jail state in player snapshots and recover it after refresh.
- Update the frontend projection and room UI for card resolution and jail release.
- Add automated validation for card cash movement and jail release flow.

## Impact

- Affected code: `backend/internal/rooms/`, `packages/contracts/`, `packages/board-config/`, `frontend/src/network/`, `frontend/src/state/`, `frontend/src/features/`, and tests.
- Affected systems: tile effect resolution, player turn gating, reconnect-safe room state, and frontend projection.