# Purpose

Define server-issued room-scoped player sessions for multiplayer room authorization and reconnect.

# Requirements

### Requirement: Room create and join return a room-scoped player session
The system SHALL issue a room-scoped player session whenever a player creates or joins a room.

#### Scenario: Host creates a room
- **WHEN** a player creates a room from the web client
- **THEN** the backend SHALL return the authoritative room snapshot plus a room-scoped player session containing the created player seat and an authorization token

#### Scenario: Guest joins a room
- **WHEN** a player joins an open room with a valid player name
- **THEN** the backend SHALL return the authoritative room snapshot plus a room-scoped player session for the joined seat

### Requirement: Mutating room commands require a matching room-scoped session
The system MUST validate mutating room commands against a room-scoped player session instead of trusting a client-reported player identity alone.

#### Scenario: Player submits a turn command with a valid room session
- **WHEN** the client sends a mutating room command with a valid room-scoped session token bound to the same player seat
- **THEN** the backend SHALL authorize the command subject to normal game-state validation

#### Scenario: Player attempts to impersonate another seat
- **WHEN** the client sends a mutating room command with a missing, invalid, or mismatched room-scoped session token
- **THEN** the backend SHALL reject the command and preserve the current room state