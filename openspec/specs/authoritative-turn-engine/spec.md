# Purpose

Define the server-authoritative gameplay engine, turn phases, and synchronization primitives.

# Requirements

### Requirement: Gameplay outcomes are server authoritative
The system MUST resolve turn ownership, dice results, movement, tile effects, purchases, rent, cards, jail, bankruptcy, and match completion on the backend.

#### Scenario: Current player rolls the dice
- **WHEN** the current turn owner sends a valid roll command during the roll phase
- **THEN** the backend SHALL generate the dice result, resolve movement, and emit authoritative events describing the outcome

#### Scenario: Non-current player attempts a gameplay action
- **WHEN** a player who is not allowed to act sends a gameplay command
- **THEN** the backend SHALL reject the command and SHALL NOT mutate match state

### Requirement: Game progression follows an explicit turn and phase model
The system SHALL represent in-progress matches using explicit turn ownership and turn phases so that gameplay flow remains deterministic and auditable.

#### Scenario: Turn advances after resolution completes
- **WHEN** the backend finishes resolving the current player's move and all required follow-up actions
- **THEN** the system SHALL transition to the next allowed turn phase or the next player's turn according to the rules

#### Scenario: Match waits on a pending decision
- **WHEN** a player is required to make a follow-up decision such as purchasing an unowned property or resolving a rules branch
- **THEN** the backend SHALL place the match in a pending-decision state and block unrelated gameplay actions until that decision resolves

### Requirement: Match synchronization supports ordered events and recovery snapshots
The system SHALL publish ordered gameplay events and SHALL persist snapshots suitable for reconnect recovery and debugging.

#### Scenario: Client misses an event sequence
- **WHEN** a client detects that one or more authoritative gameplay events were missed or received out of order
- **THEN** the client SHALL be able to request a current authoritative snapshot and resume from the corrected sequence state

#### Scenario: Backend records a state mutation
- **WHEN** the backend applies a gameplay state mutation
- **THEN** the system SHALL associate the mutation with an ordered event or version marker that can be used for synchronization and audit purposes
