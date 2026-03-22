# Purpose

Update reconnect-safe frontend projection behavior so refresh and recovery preserve authoritative room identity instead of switching to local demo projection.

# Requirements

### Requirement: Streamed room events remain reconnect-safe
The system MUST keep the web projection coherent when SSE disconnects, reconnects, or encounters sequence gaps.

#### Scenario: Joined player refreshes during an in-progress room
- **WHEN** the frontend reloads a room while holding a valid room-scoped player session
- **THEN** it SHALL restore the latest authoritative room snapshot, resume projection synchronization, and preserve the player's joined-seat identity in the UI

#### Scenario: Room fetch fails during recovery
- **WHEN** the frontend cannot restore the authoritative room during refresh or reconnect
- **THEN** it SHALL surface an explicit recovery failure state instead of applying unsafe local sample projection
