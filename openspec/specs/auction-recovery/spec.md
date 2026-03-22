# Purpose

Define reconnect-safe auction event delivery and projection recovery.

# Requirements

### Requirement: Auction events remain live and reconnect-safe
The system MUST deliver auction room events through the same ordered live stream and catch-up model used for the rest of the room.

#### Scenario: Viewer refreshes during an auction
- **WHEN** a room is already in an auction phase and a client reloads the room
- **THEN** the authoritative snapshot SHALL restore the pending lot, leading bid, current bidder, passed players, and stage explanation without requiring manual reconstruction

#### Scenario: Non-active viewer watches the auction settle
- **WHEN** another player bids or passes during a live room session
- **THEN** passive viewers SHALL receive the authoritative auction events and update their projection without requiring a manual refresh

#### Scenario: Another player bids or passes
- **WHEN** a non-acting viewer watches another participant bid or pass in a live room
- **THEN** the room page SHALL update the auction stage summary without requiring a manual refresh
