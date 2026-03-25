# Purpose

Improve board-level readability for active multi-party pressure stages.

# Requirements

### Requirement: BoardScene explains active multi-party pressure stages inside the board
The system SHALL explain auction, trade response, and deficit recovery directly inside the board scene without creating a new gameplay phase.

#### Scenario: A supported multi-party pressure stage is active
- **WHEN** the board is in `awaiting-auction`, `awaiting-trade-response`, or `awaiting-deficit-resolution`
- **THEN** the board SHALL present a concise phase focus message identifying the current decision owner, the affected counterpart when relevant, and the stage pressure source

### Requirement: Multi-party phase focus keeps action ownership readable
The system SHALL visually distinguish the current decision owner from affected but non-controlling players.

#### Scenario: A supported phase focus cue is active
- **WHEN** the board is showing a supported multi-party phase focus cue
- **THEN** the board SHALL emphasize the current decision owner more strongly than secondary affected players

### Requirement: Multi-party phase focus is reflected in semantic board summaries
The system SHALL expose concise phase focus summaries through the board host summary surface.

#### Scenario: A phase focus cue is active
- **WHEN** the board host summary is read by automation or assistive technologies
- **THEN** it SHALL include a concise multi-party phase focus summary