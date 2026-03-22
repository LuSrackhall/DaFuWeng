# Purpose

Update authoritative multiplayer room lifecycle behavior so the formal web MVP uses server-issued player sessions and reconnect-safe room entry.

# Requirements

### Requirement: Players can create and manage multiplayer rooms
The system SHALL allow authenticated or guest-session players to create rooms, join rooms, leave rooms, ready up, and start matches through explicit room lifecycle states controlled by the backend.

#### Scenario: Host creates a room
- **WHEN** a player creates a room from the client
- **THEN** the backend creates a room with a unique identifier, records the player as host, and returns the initial room state plus a room-scoped player session for the host

#### Scenario: Player joins an open room
- **WHEN** a player submits a valid room join request for a room that is accepting players
- **THEN** the backend adds the player to the room roster, broadcasts the updated room state to all room participants, and returns a room-scoped player session for that joined seat

### Requirement: Room state changes are explicit and recoverable
The system SHALL model room lifecycle using explicit states and SHALL persist enough room state to support reconnects and operational inspection.

#### Scenario: Player refreshes a joined room in the same browser
- **WHEN** a player refreshes a room view after previously creating or joining that room
- **THEN** the client SHALL use the stored room-scoped player session to restore the same joined seat instead of inheriting another player seat by default

### Requirement: Room commands are validated by backend authority
The system MUST validate room actions against host permissions, roster constraints, current room state, and room-scoped player session ownership before applying them.

#### Scenario: Non-host attempts to start a room with another player's identity
- **WHEN** a client presents a room-scoped player session that does not belong to the host seat and attempts to start the room
- **THEN** the backend SHALL reject the command and preserve the current room state
