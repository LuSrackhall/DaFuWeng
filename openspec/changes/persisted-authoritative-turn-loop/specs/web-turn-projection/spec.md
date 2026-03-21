## ADDED Requirements

### Requirement: The web client submits authoritative roll commands
The system SHALL allow the active room view to submit a real `roll-dice` command to the backend.

#### Scenario: Current player triggers roll from the room UI
- **WHEN** the current player activates the roll control in the web client
- **THEN** the client SHALL send a `roll-dice` request carrying the room id, player id, and idempotency key to the backend

### Requirement: The web client projects authoritative roll results
The system SHALL update the visible room state from the authoritative roll response instead of synthesizing local gameplay truth.

#### Scenario: Backend returns a resolved roll snapshot
- **WHEN** the backend responds with the updated authoritative snapshot and events
- **THEN** the client SHALL update visible last roll, player positions, current turn display, and event log from that response

#### Scenario: Player refreshes after a resolved roll
- **WHEN** the room page reloads after a successful roll
- **THEN** the client SHALL reconstruct the same visible room state from the latest authoritative snapshot metadata without depending on stale component state