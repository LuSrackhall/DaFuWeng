## ADDED Requirements

### Requirement: Dice rolls are resolved by backend authority
The system MUST resolve dice values, movement, and post-roll room state on the backend.

#### Scenario: Current player rolls once during their turn
- **WHEN** the current turn player submits a valid `roll-dice` command while the room is waiting for a roll
- **THEN** the backend SHALL generate the dice result, move the player, update the authoritative room snapshot, and emit ordered room events describing the result

#### Scenario: Non-current player attempts to roll
- **WHEN** a player who is not the current turn owner submits `roll-dice`
- **THEN** the backend SHALL reject the command and SHALL NOT mutate room snapshot version, event sequence, player position, or recent events

### Requirement: The first turn loop uses explicit post-roll state
The system SHALL represent the room as waiting for a roll before mutation and in a follow-up pending state after the roll resolves.

#### Scenario: Roll resolution completes
- **WHEN** the backend finishes applying the roll movement
- **THEN** the authoritative room snapshot SHALL expose a post-roll pending action label suitable for the next rules slice