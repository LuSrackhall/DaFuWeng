## ADDED Requirements

### Requirement: Chance and community tiles resolve deterministic card effects
The system MUST resolve backend-owned deterministic effects when a player lands on a card tile.

#### Scenario: Player lands on a community tile
- **WHEN** a valid roll ends on a community tile
- **THEN** the backend SHALL apply the configured deterministic effect, append ordered room events, and advance normal turn flow

#### Scenario: Player lands on a chance tile
- **WHEN** a valid roll ends on a chance tile
- **THEN** the backend SHALL apply the configured deterministic effect, append ordered room events, and advance normal turn flow