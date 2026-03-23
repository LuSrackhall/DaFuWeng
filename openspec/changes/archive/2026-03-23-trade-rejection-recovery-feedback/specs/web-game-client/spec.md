# Purpose

Clarify how rejected trades recover the room state and player understanding.

# Requirements

### Requirement: Rejected trades render as a recovery-oriented result card
The system SHALL present a rejected trade as a dedicated recovery result card after the room exits the waiting-for-response state.

#### Scenario: Rejected trade restores the proposer's turn
- **WHEN** a pending trade is rejected and the room returns to its next authoritative step
- **THEN** the room page SHALL explain who rejected whose offer, that no cash or assets changed hands, and that the proposer has resumed the room flow

#### Scenario: Rejected trade result survives replay and recovery
- **WHEN** a client reconstructs room state after a rejected trade through refresh, reconnect, or event catch-up
- **THEN** the room page SHALL still render the rejected offer summary without depending on a separately retained proposal event