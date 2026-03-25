# Purpose

Strengthen multiplayer recovery validation for real browser refresh and continued-game bankruptcy handoff.

# Requirements

## Requirement: The project validates 4-player real-room refresh recovery

The system SHALL provide browser validation that a seated player in a 4-player room can refresh and recover the same authoritative seat and active-turn state.

### Scenario: The active player refreshes during a 4-player room

- **WHEN** a seated player refreshes the browser while a 4-player room is already in progress
- **THEN** that player SHALL recover the same room seat, the latest authoritative turn state, and the correct action permissions

## Requirement: The project validates continued-game bankruptcy handoff in a 3-player room

The system SHALL provide validation that a 3-player room continues correctly when one player declares bankruptcy and two active players remain.

### Scenario: Bankruptcy does not finish a 3-player room

- **WHEN** one player in a 3-player room declares bankruptcy to another player while a third player is still active
- **THEN** the room SHALL remain in progress and hand the turn to the correct remaining active player