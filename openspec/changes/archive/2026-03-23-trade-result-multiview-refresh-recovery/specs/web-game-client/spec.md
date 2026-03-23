# Purpose

Clarify how trade result cards recover across multiple viewer roles after a browser reload.

# Requirements

### Requirement: Trade result cards survive browser reload across viewer roles
The system SHALL recover accepted and rejected trade result cards consistently after responder or spectator views reload the room page.

#### Scenario: Responder reloads an accepted or rejected result
- **WHEN** the trade responder reloads the browser after an accepted or rejected trade result is visible
- **THEN** the room page SHALL still show the correct result card and the resumed room state from the responder's perspective

#### Scenario: Spectator reloads an accepted or rejected result
- **WHEN** a read-only spectator reloads the browser after an accepted or rejected trade result is visible
- **THEN** the room page SHALL still show the correct result card and remain clearly read-only without returning to a pending trade stage