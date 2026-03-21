# Purpose

Define the authoritative auction flow triggered by declining an unowned property.

# Requirements

### Requirement: Declining an unowned property starts an auction
The system MUST enter an authoritative auction state when the acting player declines an unowned property.

#### Scenario: Player declines the landed property
- **WHEN** the current acting player submits a valid `decline-property` command for an unowned property
- **THEN** the backend SHALL create a pending auction, assign the next bidder in turn order, and keep the room in an authoritative auction phase until settlement

### Requirement: Auction actions are validated and settle deterministically
The system MUST validate auction bid or pass commands and settle ownership when the auction ends.

#### Scenario: Player wins the auction
- **WHEN** a valid bidder remains with the highest accepted bid after other players pass
- **THEN** the backend SHALL deduct the winning bid, assign ownership, append ordered auction events, and advance normal turn flow

#### Scenario: No player bids
- **WHEN** every player passes without creating a valid bid
- **THEN** the backend SHALL end the auction without changing ownership and SHALL advance normal turn flow
