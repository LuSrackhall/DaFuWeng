## Context

The repository already has a broad backend-authoritative Monopoly rules surface, plus a React web client that renders room state from snapshots and SSE events. However, the formal product path is still undermined by two prototype shortcuts:

- the lobby and room projection fall back to sampleProjection or demo-room when a real backend room is missing
- the frontend stores a player identity locally and submits that playerId directly, while the backend trusts the payload instead of validating that the caller owns that seat

Those shortcuts make the project look more complete in demos, but they also make real multiplayer untrustworthy. A player can open a room link without joining, inherit the current turn identity on the client, and attempt to act. The MVP needs a room-scoped session model and a strict no-demo fallback policy for the real room flow.

## Goals / Non-Goals

**Goals:**
- Add a minimal room-scoped player session model that works for guest players without introducing a full account system.
- Ensure create room and join room return both the room snapshot and a backend-issued player session token.
- Require mutating commands to validate the player session token against the requested player seat before changing room state.
- Remove sample gameplay fallback from the real lobby and game pages, replacing it with explicit loading, error, reconnect, or spectator states.
- Preserve snapshot plus SSE projection recovery so a refreshed client returns to the same authoritative room state.
- Keep one believable two-player MVP flow working end to end.

**Non-Goals:**
- Implement a global account system, matchmaking, or friend graph.
- Rework all advanced Monopoly rule branches in this change.
- Replace the current board scene with a full Pixi production scene.
- Build spectator-specific features beyond read-only room viewing.

## Decisions

### 1. Use room-scoped player session tokens instead of a full auth system

Create room and join room will return a response envelope containing the authoritative room snapshot plus a player session object with playerId, playerName, and a random token. The frontend stores this token locally per room and sends it in a dedicated request header for later mutating commands.

Why:
- It is the smallest step from self-reported identity to backend-validated identity.
- It supports refresh and rejoin in the same browser without adding account management.
- It keeps command authorization tied to the room seat that created or joined the room.

Alternative considered:
- Inferring identity solely from stored playerId on the frontend. Rejected because it does not block impersonation.

### 2. Keep the existing room snapshot model and extend it with session-aware entry responses

The shared ProjectionSnapshot remains the primary room truth for rendering. Instead of changing every read path, create and join will return a new envelope with snapshot plus session metadata, while ordinary room GET continues to return snapshot only.

Why:
- It minimizes churn in the projection layer.
- It avoids requiring SSE or catch-up endpoints to return secret material.
- It lets spectator and reconnect views continue to consume the same public room shape.

Alternative considered:
- Embedding tokens into the room snapshot. Rejected because snapshots are shared to all room viewers and event subscribers.

### 3. Remove demo-room and sampleProjection from the formal MVP path

LobbyPage will stop auto-loading demo-room, and useGameProjection will stop replacing failed room fetches with sampleProjection. When the backend room cannot be fetched, the UI must show an explicit failure state. GamePage will allow read-only viewing only when a room can be fetched but the browser does not hold a valid player session.

Why:
- Silent demo fallback is the main reason users believe the app is running while the real multiplayer path is broken.
- A truthful failure state is better than a fake playable state when shipping an MVP.

Alternative considered:
- Keeping demo mode behind the same default route. Rejected because it continues to blur prototype behavior and product behavior.

### 4. Validate all mutating commands through a shared backend helper

The Go room service will add a shared helper that reads the room player token header, finds the corresponding player in the room, and ensures the token matches the payload playerId or hostId before dispatching create, start, roll, buy, and other room commands.

Why:
- The bug surface is cross-cutting and should not be reimplemented in every handler manually.
- It preserves the current payload shapes while adding server authority.

Alternative considered:
- Dropping playerId from every request immediately and deriving seat identity only from the token. Rejected for this MVP because it creates wider contract churn than necessary.

### 5. Keep advanced gameplay features callable after authorization rather than deleting them

This change does not need to remove advanced commands such as auction, jail, trade, or mortgage. Instead, it focuses on ensuring the real room flow and authorization are trustworthy. The MVP path will emphasize the basic loop in UI, but secure command routing will also protect the existing deeper branches.

Why:
- Removing the code paths would add risk and slow the MVP.
- Authorizing all mutating commands gives immediate value even if some branches remain rough.

## Risks / Trade-offs

- [Stored room token is lost between devices] -> The MVP will support refresh and same-browser rejoin, but not seamless cross-device re-authentication without rejoining.
- [Contract changes ripple through frontend and tests] -> Keep the main snapshot shape stable and only wrap create and join responses.
- [Existing tests depend on demo fallback or direct sessionStorage tricks] -> Update E2E to use the formal create and join flow and stable stored player sessions.
- [Advanced command handlers might miss the new authorization helper] -> Route all mutating endpoints through one shared player session validation path.

## Migration Plan

1. Add OpenSpec delta specs for room player sessions, room lifecycle, web client room entry, and projection recovery.
2. Extend shared contracts with player session response types.
3. Update the backend room service to mint, persist, and validate room player session tokens.
4. Remove demo-room seeding and frontend sample fallback from the formal app flow.
5. Update lobby, room API helpers, active player storage, and room page actions to use the new session envelope.
6. Add or update automated tests for the two-browser MVP loop and refresh recovery.

## Open Questions

- Whether a later change should add an explicit leave-room or reclaim-seat flow for rooms that have not started.
- Whether spectator mode should later expose its own clearer route or badge once the MVP is stable.
