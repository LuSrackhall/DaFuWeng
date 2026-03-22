# Purpose

Clarify how accepted trades are presented after settlement.

# Requirements

### Requirement: Accepted trades render as a bilateral settlement card
The system SHALL present an accepted trade as a dedicated bilateral settlement card after the trade resolves.

#### Scenario: Accepted trade settles
- **WHEN** a pending trade is accepted and the room returns to its next authoritative step
- **THEN** the room page SHALL show who exchanged what, how the cash landed for both trade parties, and what room step comes next

#### Scenario: Other players review the accepted result
- **WHEN** a player or read-only viewer sees the accepted trade result after settlement
- **THEN** the room page SHALL present the same bilateral settlement summary consistently across clients