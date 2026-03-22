# Purpose

Update the web-first authoritative multiplayer client so formal room entry and gameplay never silently degrade into local demo gameplay.

# Requirements

### Requirement: The web client presents an authoritative multiplayer game view
The system SHALL provide a web client that renders room flows, the board scene, player state, action prompts, and event feedback using authoritative backend state as its input.

#### Scenario: Player enters an active room
- **WHEN** a player opens or rejoins an active room in the web client
- **THEN** the client SHALL render the current room and match state from the latest authoritative snapshot and event stream, plus the player's joined-seat state when a valid room-scoped player session is present

### Requirement: Formal room flows never silently fall back to local demo gameplay
The system MUST distinguish between a real authoritative room, a reconnectable joined room, and an unavailable room state.

#### Scenario: Backend room is unavailable
- **WHEN** the web client fails to load a requested room from the backend
- **THEN** the client SHALL show an explicit loading or failure state instead of substituting local sample gameplay

#### Scenario: Viewer opens a room without a joined-seat session
- **WHEN** the web client loads a real room but does not hold a valid room-scoped player session for that room
- **THEN** the client SHALL render the room in a read-only state and SHALL NOT default command privileges to the current turn player
