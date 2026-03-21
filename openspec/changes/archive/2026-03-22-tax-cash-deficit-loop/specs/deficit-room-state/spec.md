## ADDED Requirements

### Requirement: Pending deficit state survives reconnect and refresh
The system SHALL persist deficit details in the room snapshot.

#### Scenario: Viewer reloads during deficit resolution
- **WHEN** the room is waiting on a deficit player to resolve a forced payment
- **THEN** the authoritative snapshot SHALL restore the pending payment reason, amount, and acting player
