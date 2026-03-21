## ADDED Requirements

### Requirement: Jail decision state survives reconnect
The system SHALL persist jail attempt counters and current release options in the room snapshot.

#### Scenario: Client refreshes while the current player is jailed
- **WHEN** a viewer reloads during a jailed player's turn
- **THEN** the restored snapshot SHALL still identify the jailed player, their failed attempt count, and the jail decision state