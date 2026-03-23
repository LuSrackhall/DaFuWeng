# Purpose

Clarify that neutral room results keep a neutral emotional treatment.

# Requirements

### Requirement: Neutral room results keep a confirmation-state tone
The system SHALL present neutral room results as resolved state confirmations rather than celebratory success feedback.

#### Scenario: Trade offer is rejected
- **WHEN** a pending trade is formally rejected and the room returns to the proposer
- **THEN** the room board and result card SHALL present that outcome with a neutral confirmation tone

#### Scenario: Auction ends without a winner
- **WHEN** an auction ends unsold and the property remains unowned
- **THEN** the room board and result card SHALL present that outcome with a neutral confirmation tone