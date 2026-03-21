## Why

The repository now has a usable room shell, but the core multiplayer fairness boundary is still incomplete. The backend can create, join, start, and read room snapshots, yet there is no real authoritative turn mutation path, no versioned recovery contract, and no persistence-friendly state boundary for reconnect or restart recovery.

Without a true authoritative roll flow, the project still cannot prove that gameplay progression is server-owned, replay-safe, and reconnect-safe. This change focuses on the smallest meaningful vertical slice that establishes those guarantees before more rule branches such as property purchase, rent, cards, or jail are added.

## What Changes

- Add a server-authoritative `roll-dice` gameplay command with turn ownership validation and idempotency protection.
- Introduce room snapshot versioning and ordered room event sequences so clients can reason about recovery and stale state.
- Add a persistence boundary for authoritative room snapshots, event logs, and processed idempotency keys, while keeping rule execution in Go.
- Update the frontend to submit real roll commands and render the resulting authoritative room snapshot and event feed.
- Expand automated validation to cover the room lifecycle plus the first resolved turn, including a rejection path and a recovery path.

## Capabilities

### New Capabilities
- `persisted-room-state`: Persist and recover authoritative room state with snapshot versions, event sequences, and idempotency records.
- `authoritative-roll-turn`: Execute the first real turn mutation on the backend through an authoritative dice roll flow.
- `web-turn-projection`: Project an authoritative roll result in the web client and recover cleanly after refresh.

### Modified Capabilities
- `multiplayer-room-lifecycle`: Rooms now expose versioned authoritative snapshots suitable for follow-up gameplay mutations.
- `web-game-client`: The web client now consumes the first live gameplay mutation path instead of rendering only a started-room shell.

## Impact

- Affected code: `packages/contracts/`, `backend/internal/rooms/`, `backend/internal/pocketbase/`, `frontend/src/network/`, `frontend/src/state/`, `frontend/src/features/`, and test workflows.
- Affected systems: room state persistence, HTTP gameplay commands, reconnect-safe client synchronization, and release gating for the first real turn loop.
- Affected APIs: room snapshot payloads, room event metadata, roll-dice command contracts, and frontend recovery semantics.
- Dependencies: existing Go service, PocketBase integration boundary, React frontend projection logic, and Playwright plus integration coverage.