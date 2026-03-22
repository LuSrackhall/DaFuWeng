# Purpose

Define reconnect-safe pending deficit room state.

# Requirements

### Requirement: Pending deficit state survives reconnect and refresh
The system SHALL persist deficit details in the room snapshot.

#### Scenario: Viewer reloads during deficit resolution
- **WHEN** the room is waiting on a deficit player to resolve a forced payment
- **THEN** the authoritative snapshot SHALL restore the pending payment reason, amount, and acting player

### Requirement: Pending deficit state is human-readable
The system SHALL explain pending deficit details in a way that both the acting player and observers can follow.

#### Scenario: Player enters deficit resolution
- **WHEN** the room is waiting on a player to resolve a forced payment
- **THEN** the client SHALL show the debt source, creditor, total amount, current player cash, and the remaining action expected from the debtor

#### Scenario: Player can still recover
- **WHEN** the deficit player still has available recovery actions such as mortgage
- **THEN** the client SHALL present those actions alongside the current deficit summary instead of separating them from the debt explanation
