## ADDED Requirements

### Requirement: Unowned purchasable landings enter a property decision state
The system MUST move the room into an authoritative property decision state when the acting player lands on an unowned purchasable tile.

#### Scenario: Current player lands on a purchasable unowned tile
- **WHEN** a valid `roll-dice` command resolves to an unowned purchasable tile
- **THEN** the authoritative room snapshot SHALL enter `awaiting-property-decision` and expose the pending property metadata needed for a buy or decline decision

### Requirement: Property decisions are validated by backend authority
The system MUST validate acting player, room phase, tile ownership, and affordability before committing a property decision.

#### Scenario: Acting player buys the pending property
- **WHEN** the current acting player submits a valid `purchase-property` command for the pending unowned tile
- **THEN** the backend SHALL deduct the tile price, assign ownership, append ordered room events, and advance the room to the next roll state

#### Scenario: Acting player declines the pending property
- **WHEN** the current acting player submits a valid `decline-property` command for the pending unowned tile
- **THEN** the backend SHALL leave ownership unchanged, append ordered room events, and advance the room to the next roll state

#### Scenario: Invalid property decision is submitted
- **WHEN** a non-current player, stale client, or unaffordable buyer submits a property decision command
- **THEN** the backend SHALL reject the command and SHALL NOT mutate ownership, cash, snapshot version, or event sequence
