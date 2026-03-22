# Purpose

Clarify stage-oriented room presentation for live auctions and supporting room context.

# Requirements

### Requirement: The room page gives auction a dominant stage surface
The system SHALL elevate auction into the room page's primary stage surface while it is active.

#### Scenario: Auction is active
- **WHEN** the room is waiting on bids or passes for a pending auction
- **THEN** the room page SHALL prioritize auction state, controls, and outcomes above secondary status panels

#### Scenario: Auction settles
- **WHEN** the auction ends with a winning bidder or no sale
- **THEN** the room page SHALL explain the settlement outcome and transition cleanly back to the next authoritative room step