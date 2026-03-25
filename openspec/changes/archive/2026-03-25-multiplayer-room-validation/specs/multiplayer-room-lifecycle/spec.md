# Purpose

Strengthen real-browser validation for 3-player and 4-player authoritative room flows.

# Requirements

## Requirement: The project validates 3-player real room synchronization

The system SHALL provide end-to-end browser validation that a 3-player room can create, join, start, and rotate turns while all pages stay synchronized to the same authoritative state.

### Scenario: A 3-player room starts and advances turns

- **WHEN** one host and two guests join the same real room and the host starts the match
- **THEN** all pages SHALL converge on the same current-turn state and authoritative handoff sequence as turns advance

## Requirement: The project validates full-room rejection at 4 players

The system SHALL provide end-to-end browser validation that a room can fill to four players and reject a fifth join attempt.

### Scenario: A room reaches max capacity

- **WHEN** four players occupy the same room and another player attempts to join
- **THEN** the extra player SHALL be rejected and the four-player room SHALL still be able to start normally