## 1. Room Surface Hierarchy

- [x] 1.1 Refactor the room overview card so it focuses on room identity, current actor, host, and roster instead of repeating stage guidance.
- [x] 1.2 Refactor stage cards so they keep stage context and outcome detail without duplicating the primary action anchor's directive copy or controls.
- [x] 1.3 Preserve the primary action anchor as the single directive action surface across room states.

## 2. Recent Event Feed

- [x] 2.1 Promote recent events from the diagnostics drawer into a formal player-facing event feed near the board stage.
- [x] 2.2 Add bounded local settings for near-event placement, numbering direction, and visible count.
- [x] 2.3 Keep diagnostics focused on technical room state while preserving access to raw event sequence context.

## 3. Auction Input Experience

- [x] 3.1 Refine the auction input UI so the minimum valid bid, quick-bid flow, and invalid-input feedback are clearer.
- [x] 3.2 Preserve clear read-only auction messaging for spectators, passed bidders, and non-acting viewers.

## 4. Validation

- [x] 4.1 Add Vitest coverage for event-feed display helpers and keep action-surface helper coverage current.
- [x] 4.2 Add Vitest coverage for event-feed settings defaults, clamping, and ordering behavior.
- [x] 4.3 Add Playwright coverage for room-surface deduplication, event-feed defaults/settings, and auction input behavior.
- [x] 4.4 Preserve frontend type-check and existing reconnect-related browser coverage.