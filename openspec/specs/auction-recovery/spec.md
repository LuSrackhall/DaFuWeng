# Purpose

Define reconnect-safe auction event delivery and projection recovery.

# Requirements

### Requirement: Auction events remain live and reconnect-safe
The system MUST deliver auction room events through the same ordered live stream and catch-up model used for the rest of the room.

#### Scenario: Non-active viewer watches the auction settle
- **WHEN** another player bids or passes during a live room session
- **THEN** passive viewers SHALL receive the authoritative auction events and update their projection without requiring a manual refresh
