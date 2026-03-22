# Purpose

Clarify the room-page trade proposal surface for selector-based asset choice.

# Requirements

### Requirement: The trade proposal surface exposes real asset pools
The system SHALL present visible asset pools for both sides of a proposed trade while a proposer is composing an offer.

#### Scenario: Proposer prepares a trade offer
- **WHEN** the current turn player opens the trade proposal surface
- **THEN** the room page SHALL show who the offer targets, what assets the proposer can offer, what assets the target can be asked to give up, and how the current draft changes the bilateral trade summary

#### Scenario: Trade draft updates
- **WHEN** the proposer selects or deselects a property or card in the trade proposal surface
- **THEN** the room page SHALL update the visible trade summary without requiring manual asset identifier entry