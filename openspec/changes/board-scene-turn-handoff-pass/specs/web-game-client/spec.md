# Purpose

Improve board-level readability when authoritative turn ownership changes.

# Requirements

### Requirement: BoardScene bridges authoritative turn handoff inside the board
The system SHALL explain authoritative turn ownership changes directly inside the board scene without creating a new gameplay phase.

#### Scenario: The turn advances to the next player
- **WHEN** an authoritative `turn-advanced` result becomes the latest board-level ownership change
- **THEN** the board SHALL present a concise handoff message that identifies the incoming active player and next phase

### Requirement: Previous board results step back when the next player takes control
The system SHALL visually reduce the prominence of the previous resolved board result when the next player takes the stage.

#### Scenario: A handoff cue is active
- **WHEN** the board is showing a supported turn handoff cue
- **THEN** the board SHALL keep the previous result context readable while lowering its visual dominance behind the incoming turn owner

### Requirement: Turn handoff context is reflected in semantic board summaries
The system SHALL expose concise handoff summaries through the board host summary surface.

#### Scenario: A handoff cue is active
- **WHEN** the board host summary is read by automation or assistive technologies
- **THEN** it SHALL include a concise handoff summary naming the incoming active player and the next stage