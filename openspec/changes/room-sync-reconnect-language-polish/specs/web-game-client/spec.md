# Purpose

Clarify how the room page behaves when realtime updates fail after the room page has already loaded.

# Requirements

### Requirement: Realtime reconnect uses a distinct room sync state
The system SHALL present realtime reconnect as a distinct in-page sync state instead of reusing first-load or fallback language.

#### Scenario: Realtime updates fail after a room has already loaded
- **WHEN** the room page has already loaded and the realtime event connection fails
- **THEN** the room page SHALL show reconnect-focused guidance while preserving the last successful room state

### Requirement: Realtime reconnect recovers through room catch-up
The system SHALL clear the reconnect sync shell after room catch-up succeeds.

#### Scenario: Polling catches up after realtime failure
- **WHEN** realtime updates fail and a later room catch-up response succeeds
- **THEN** the reconnect sync shell SHALL disappear and the room page SHALL show the recovered latest state