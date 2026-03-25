# Purpose

Improve board-level readability when high-pressure stages close and the room resumes the main turn flow.

# Requirements

### Requirement: BoardScene narrates supported high-pressure stage closure inside the board
The system SHALL explain when supported high-pressure stages have fully closed without creating a new gameplay phase.

#### Scenario: A supported stage has just closed
- **WHEN** auction, trade response, or deficit recovery ends with an authoritative result supported by the board scene
- **THEN** the board SHALL present a concise closure message identifying what result landed and that the room has resumed

### Requirement: BoardScene uses authoritative resume context after closure
The system SHALL explain the resumed main-turn context using authoritative state.

#### Scenario: The board shows a closure cue
- **WHEN** a supported closure cue is active
- **THEN** it SHALL identify which player and stage the room has resumed to using the current authoritative turn state

### Requirement: Phase closure context is reflected in semantic board summaries
The system SHALL expose concise closure summaries through the board host summary surface.

#### Scenario: A closure cue is active
- **WHEN** the board host summary is read by automation or assistive technologies
- **THEN** it SHALL include a concise closure summary naming the settled outcome and the resumed stage