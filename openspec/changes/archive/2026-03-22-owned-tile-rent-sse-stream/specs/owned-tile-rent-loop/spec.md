## ADDED Requirements

### Requirement: Owned rentable tiles settle rent authoritatively
The system MUST settle rent when the acting player lands on a rentable tile another player owns.

#### Scenario: Player lands on another player's property
- **WHEN** a valid roll resolves to a rentable tile owned by another player
- **THEN** the backend SHALL deduct rent from the acting player, credit the owner, append ordered rent settlement events, and advance the room to the next roll state

#### Scenario: Player lands on their own property
- **WHEN** a valid roll resolves to a rentable tile already owned by the acting player
- **THEN** the backend SHALL NOT transfer rent and SHALL still advance the room through the normal turn flow
