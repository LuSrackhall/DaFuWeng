# Purpose

Clarify optional normal-turn tools on the room page.

# Requirements

### Requirement: Optional normal-turn tools stay behind a collapsible shelf
The system SHALL keep optional normal-turn tools behind a secondary collapsible shelf when no dedicated stage surface is active.

#### Scenario: Player enters a normal roll state
- **WHEN** the room is waiting on the current player to roll and optional tools such as trade drafting or property development are available
- **THEN** the room page SHALL keep those tools collapsed by default while still indicating that they are available

#### Scenario: Player opens the tools shelf
- **WHEN** the acting player expands the turn-tools shelf during a normal roll state
- **THEN** the room page SHALL reveal the optional trade drafting and property development surfaces without replacing the main action surface