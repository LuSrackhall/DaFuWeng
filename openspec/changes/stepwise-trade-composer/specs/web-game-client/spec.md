# Purpose

Clarify stepwise normal-turn trade drafting on the room page.

# Requirements

### Requirement: The normal-turn trade draft uses a stepwise composer
The system SHALL guide the acting player through a stepwise trade-drafting flow when they open the optional trade tool during a normal roll state.

#### Scenario: Player starts a trade draft
- **WHEN** the acting player opens the trade drafting tool during a normal roll state
- **THEN** the room page SHALL guide the player through selecting a counterparty, choosing offered assets, choosing requested assets, and reviewing the final draft before submission

#### Scenario: Player confirms a drafted trade
- **WHEN** the acting player reaches the final review step and confirms the draft
- **THEN** the room page SHALL send the existing trade proposal command and transition all clients into the current pending trade response stage