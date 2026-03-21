## ADDED Requirements

### Requirement: Deficit players can declare bankruptcy
The system MUST allow the current deficit player to declare bankruptcy.

#### Scenario: Player goes bankrupt during deficit resolution
- **WHEN** the current deficit player submits a valid bankruptcy command
- **THEN** the backend SHALL mark the player bankrupt, clear their properties from active ownership, and advance to the next active player or finish the room if only one active player remains