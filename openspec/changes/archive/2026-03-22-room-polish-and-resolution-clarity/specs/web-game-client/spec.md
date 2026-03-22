# Purpose

Clarify stage-oriented room presentation for the web multiplayer client.

# Requirements

### Requirement: The room page presents stage-oriented guidance
The system SHALL render waiting-room, active turn, and forced-resolution states using explicit stage summaries instead of mostly raw state labels.

#### Scenario: Waiting room is rendered
- **WHEN** the client loads a room that has not started
- **THEN** it SHALL show a dedicated waiting-room summary that explains room identity, host authority, seat presence, and the next step to start

#### Scenario: Forced resolution pauses the room
- **WHEN** the client renders a pending deficit or bankruptcy-capable state
- **THEN** it SHALL explain who owes whom, why the room is paused, what the acting player can do next, and what outcome ends the pause