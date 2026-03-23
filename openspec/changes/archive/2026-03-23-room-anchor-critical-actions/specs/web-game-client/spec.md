# Purpose

Clarify that the primary action anchor carries decisive controls for high-pressure room states.

# Requirements

### Requirement: The primary action anchor carries high-pressure room controls
The system SHALL expose decisive controls for auction and deficit-recovery states directly in the primary action anchor.

#### Scenario: Player must act in an auction
- **WHEN** the current player can bid or pass in an active auction
- **THEN** the primary action anchor SHALL expose direct controls to submit a bid or pass without requiring the player to scan lower detail cards first

#### Scenario: Player must resolve a deficit
- **WHEN** the current player is resolving an active cash deficit
- **THEN** the primary action anchor SHALL expose the shortest valid recovery action and the bankruptcy action before the detailed recovery card