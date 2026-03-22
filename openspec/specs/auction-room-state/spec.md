# Purpose

Define snapshot-backed auction room state restoration.

# Requirements

### Requirement: Pending auction state is snapshot-backed
The system SHALL persist enough auction state in the room snapshot to recover bidding after refresh or reconnect.

#### Scenario: Viewer refreshes during an auction
- **WHEN** a room is already in an auction phase and a client reloads the room
- **THEN** the authoritative snapshot SHALL restore the pending tile, highest bid, highest bidder, passed players, and current bidder

### Requirement: Pending auction state is human-readable
The system SHALL present enough auction snapshot data for players and viewers to understand the current lot, current bidder, leading bid, and remaining competition.

#### Scenario: Room enters auction after a declined purchase
- **WHEN** a player declines an offered property and the room transitions into auction
- **THEN** the client SHALL show the lot identity, current highest bid, current highest bidder, current acting bidder, and which players have already passed

#### Scenario: Non-acting player views an in-progress auction
- **WHEN** a joined player or spectator is not the current acting bidder during an auction
- **THEN** the client SHALL explain that the auction is active but read-only for that viewer until the turn reaches them or the auction settles
