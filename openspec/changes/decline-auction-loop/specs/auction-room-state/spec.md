## ADDED Requirements

### Requirement: Pending auction state is snapshot-backed
The system SHALL persist enough auction state in the room snapshot to recover bidding after refresh or reconnect.

#### Scenario: Viewer refreshes during an auction
- **WHEN** a room is already in an auction phase and a client reloads the room
- **THEN** the authoritative snapshot SHALL restore the pending tile, highest bid, highest bidder, passed players, and current bidder