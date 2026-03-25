# Purpose

Strengthen refresh recovery validation for the acting player in a 4-player real room.

# Requirements

## Requirement: The project validates current-turn refresh recovery in a 4-player room

The system SHALL provide browser validation that the current acting player in a 4-player room can refresh and continue the same authoritative turn.

### Scenario: The acting player refreshes before completing the turn

- **WHEN** the current acting player refreshes the browser during a 4-player room while their turn is still pending
- **THEN** that player SHALL recover the same seat, retain the current action right, and continue the same authoritative turn for all connected players