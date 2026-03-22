# Purpose

Clarify reconnect-safe auction presentation recovery.

# Requirements

### Requirement: Auction stage remains readable through live updates and refresh
The system MUST preserve a coherent auction surface when bids, passes, refreshes, and settlement updates occur.

#### Scenario: Viewer refreshes during an auction
- **WHEN** a room is already in an auction phase and a client reloads the room
- **THEN** the authoritative snapshot SHALL restore the pending lot, leading bid, current bidder, passed players, and stage explanation without requiring manual reconstruction

#### Scenario: Another player bids or passes
- **WHEN** a non-acting viewer watches another participant bid or pass in a live room
- **THEN** the room page SHALL update the auction stage summary without requiring a manual refresh