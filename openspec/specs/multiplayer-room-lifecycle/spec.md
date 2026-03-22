# Purpose

Define authoritative multiplayer room creation, joining, starting, validation, and recovery.

# Requirements

### Requirement: Players can create and manage multiplayer rooms
The system SHALL allow authenticated or guest-session players to create rooms, join rooms, leave rooms, ready up, and start matches through explicit room lifecycle states controlled by the backend.

#### Scenario: Host creates a room
- **WHEN** a player creates a room from the client
- **THEN** the backend creates a room with a unique identifier, records the player as host, and returns the initial room state plus a room-scoped player session for the host

#### Scenario: Player joins an open room
- **WHEN** a player submits a valid room join request for a room that is accepting players
- **THEN** the backend adds the player to the room roster, broadcasts the updated room state to all room participants, and returns a room-scoped player session for that joined seat

#### Scenario: Host starts the room
- **WHEN** the host starts a room that satisfies minimum player and readiness requirements
- **THEN** the backend transitions the room from a pre-game state to a starting or in-game state and locks the player roster for the match

### Requirement: Room state changes are explicit and recoverable
The system SHALL model room lifecycle using explicit states and SHALL persist enough room state to support reconnects and operational inspection.

#### Scenario: Room transitions into gameplay
- **WHEN** the backend accepts a valid start-game command
- **THEN** the room state SHALL transition through a defined lifecycle and expose the resulting state to connected clients

#### Scenario: Player reconnects to an in-progress room
- **WHEN** a disconnected player reconnects to a room they were part of
- **THEN** the backend SHALL provide a current room or game snapshot and enough sequence information for the client to resume synchronization

#### Scenario: Player refreshes a joined room in the same browser
- **WHEN** a player refreshes a room view after previously creating or joining that room
- **THEN** the client SHALL use the stored room-scoped player session to restore the same joined seat instead of inheriting another player seat by default

#### Scenario: Player leaves before match start
- **WHEN** a player leaves a room that has not started
- **THEN** the backend SHALL remove that player from the roster and broadcast the updated membership state

### Requirement: Room commands are validated by backend authority
The system MUST validate room actions against host permissions, roster constraints, and current room state before applying them.

#### Scenario: Non-host attempts to start a room
- **WHEN** a non-host player sends a start-game command
- **THEN** the backend SHALL reject the command and preserve the current room state

#### Scenario: Non-host attempts to start a room with another player's identity
- **WHEN** a client presents a room-scoped player session that does not belong to the host seat and attempts to start the room
- **THEN** the backend SHALL reject the command and preserve the current room state

#### Scenario: Player attempts to join a locked room
- **WHEN** a player attempts to join a room that is full, started, or otherwise unavailable
- **THEN** the backend SHALL reject the join request with a defined error response

### Requirement: Waiting rooms clearly communicate start readiness
The system SHALL present enough waiting-room information for players to understand who is in the room, who is host, and what still blocks match start.

#### Scenario: Player enters a room before match start
- **WHEN** the web client renders a room in the lobby state
- **THEN** it SHALL show the room identifier, current seat roster, host identity, and whether the minimum start condition has been met

#### Scenario: Start is still blocked
- **WHEN** the room has not yet met the minimum conditions to begin
- **THEN** the client SHALL explain why the host cannot start yet instead of only showing a disabled control
