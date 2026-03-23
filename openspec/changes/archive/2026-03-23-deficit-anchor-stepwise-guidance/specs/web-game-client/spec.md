# Purpose

Clarify that complex deficit recovery remains guided through the primary action anchor.

# Requirements

### Requirement: The primary action anchor guides stepwise deficit recovery
The system SHALL continue guiding deficit recovery through the primary action anchor when a single mortgage action is not enough.

#### Scenario: Player still has a shortfall after the next recovery action
- **WHEN** the current deficit cannot be fully resolved by the best immediate mortgage action
- **THEN** the primary action anchor SHALL explain the next recommended action and the remaining shortfall after that action

#### Scenario: Player continues deficit recovery after one mortgage
- **WHEN** an authoritative mortgage action succeeds but the room remains in deficit recovery
- **THEN** the primary action anchor SHALL refresh to show the next recommended recovery action from the new room snapshot