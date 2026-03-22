# Purpose

Define reconnect-safe frontend projection behavior for streamed room events.

# Requirements

### Requirement: Streamed room events remain reconnect-safe
The system MUST keep the web projection coherent when SSE disconnects, reconnects, or encounters sequence gaps.

#### Scenario: Joined player refreshes during an in-progress room
- **WHEN** the frontend reloads a room while holding a valid room-scoped player session
- **THEN** it SHALL restore the latest authoritative room snapshot, resume projection synchronization, and preserve the player's joined-seat identity in the UI

#### Scenario: Client misses one or more live events
- **WHEN** the frontend detects a gap between the last applied sequence and a streamed event or reconnect attempt
- **THEN** it SHALL recover through the existing catch-up or snapshot fallback path instead of applying an unsafe partial projection

#### Scenario: Room fetch fails during recovery
- **WHEN** the frontend cannot restore the authoritative room during refresh or reconnect
- **THEN** it SHALL surface an explicit recovery failure state instead of applying unsafe local sample projection
