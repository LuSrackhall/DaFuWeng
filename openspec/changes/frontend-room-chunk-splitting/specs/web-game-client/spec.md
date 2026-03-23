# Purpose

Clarify that the web client ships room code through chunked route delivery.

# Requirements

### Requirement: Room routes are delivered through lazy chunks
The system SHALL lazy load room-facing route modules instead of bundling them into a single eager entry chunk.

#### Scenario: User enters the room page from the lobby
- **WHEN** the user navigates from the lobby to a room route
- **THEN** the room page code SHALL be loaded through a route chunk rather than the main entry bundle

### Requirement: Lazy route loads show a shell fallback
The system SHALL show a lightweight fallback while lazy route chunks are being fetched.

#### Scenario: User cold-loads a lazy route
- **WHEN** the browser is still fetching a lazy route chunk
- **THEN** the web client SHALL render a lightweight loading shell instead of a blank page