# Purpose

Clarify readable room feedback when an auction ends without a winning bidder.

# Requirements

### Requirement: The room page explains an unsold auction outcome
The system SHALL surface a clear recent result when an auction ends without a winner.

#### Scenario: Auction ends unsold
- **WHEN** the room receives an authoritative `auction-ended-unsold` outcome
- **THEN** the room page SHALL explain that the lot remained unsold, ownership did not change, and the room has already advanced to the next authoritative step