# Purpose

Clarify readable deficit recovery actions in the room page.

# Requirements

### Requirement: Deficit recovery actions stay attached to the debt summary
The system SHALL present deficit recovery actions within the same room-stage surface that explains the debt.

#### Scenario: Player can still recover
- **WHEN** the room is waiting on a deficit player who still has mortgageable assets
- **THEN** the client SHALL show the remaining shortfall, the mortgageable assets, and the recovery actions alongside the current debt explanation instead of separating them into a secondary action strip

### Requirement: Recovery assets explain impact and limits
The system SHALL make recovery assets readable before the debtor commits an action.

#### Scenario: Player reviews recovery assets
- **WHEN** the current deficit player views the recovery surface
- **THEN** the client SHALL show each visible owned property's label, whether it is already mortgaged, its mortgage value when eligible, and whether that mortgage would fully or partially close the remaining shortfall
