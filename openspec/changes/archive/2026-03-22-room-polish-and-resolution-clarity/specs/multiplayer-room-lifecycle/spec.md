# Purpose

Clarify the authoritative waiting-room experience before match start.

# Requirements

### Requirement: Waiting rooms clearly communicate start readiness
The system SHALL present enough waiting-room information for players to understand who is in the room, who is host, and what still blocks match start.

#### Scenario: Player enters a room before match start
- **WHEN** the web client renders a room in the lobby state
- **THEN** it SHALL show the room identifier, current seat roster, host identity, and whether the minimum start condition has been met

#### Scenario: Start is still blocked
- **WHEN** the room has not yet met the minimum conditions to begin
- **THEN** the client SHALL explain why the host cannot start yet instead of only showing a disabled control