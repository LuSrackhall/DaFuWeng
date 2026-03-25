# Purpose

Improve board-level readability while supported high-pressure chains remain unresolved.

# Requirements

### Requirement: BoardScene marks the current pressure owner during supported unresolved states
The system SHALL explicitly identify the current pressure owner during supported unresolved high-pressure states without creating a new gameplay phase.

#### Scenario: A supported unresolved pressure state is active
- **WHEN** the board is showing a supported unresolved jail hold, player-creditor bankruptcy transfer, or unresolved economic-chain recovery
- **THEN** the board SHALL identify the player who currently owns the pressure loop

### Requirement: BoardScene exposes concise unresolved chain briefs
The system SHALL provide a concise brief describing why the chain remains unresolved.

#### Scenario: A supported unresolved chain brief is active
- **WHEN** the board is still waiting on a supported unresolved pressure loop
- **THEN** the board SHALL expose a concise brief naming the blocking reason or remaining recovery path

### Requirement: Actor takeover context is reflected in semantic board summaries
The system SHALL expose concise takeover summaries through the board host summary surface.

#### Scenario: A supported actor takeover cue is active
- **WHEN** the board host summary is read by automation or assistive technologies
- **THEN** it SHALL include a concise summary naming the current pressure owner and the unresolved chain context