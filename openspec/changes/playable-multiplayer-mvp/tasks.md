## 1. Session And Room Contracts

- [x] 1.1 Add shared contract types for room player sessions and create or join response envelopes.
- [x] 1.2 Add backend room persistence and helper logic for minting and validating room-scoped player session tokens.

## 2. Authoritative Room Entry

- [x] 2.1 Update room create and room join handlers to return authoritative room snapshots plus player session metadata.
- [x] 2.2 Remove demo-room seeding and formal app fallback to local sample gameplay for lobby and room entry.

## 3. Web Client MVP Flow

- [x] 3.1 Update frontend room API helpers and active player storage to use the backend-issued player session token.
- [x] 3.2 Update LobbyPage and GamePage so players can create, join, refresh, and continue a real room without inheriting another player's turn identity.
- [x] 3.3 Update the room projection hook to show explicit loading, error, reconnect, or read-only states instead of silently switching to sampleProjection.

## 4. Validation

- [x] 4.1 Add backend integration coverage for room create, join, token-bound command authorization, and the base two-player turn loop.
- [x] 4.2 Update Playwright coverage to verify two pages can join the same real room, act only as their own seats, and refresh back into the same authoritative game.
