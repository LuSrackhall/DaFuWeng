# Purpose

Improve board-level readability of key landing consequences without changing gameplay semantics.

# Requirements

### Requirement: BoardScene explains key landing consequences inside the board
The system SHALL explain property purchase, rent, tax, and jail landing consequences directly inside the board scene after the authoritative result is confirmed.

#### Scenario: A supported landing consequence is confirmed
- **WHEN** the latest authoritative board result is property-purchased, rent-charged, tax-paid, or player-jailed
- **THEN** the board SHALL present a concise board-level consequence message that explains the confirmed outcome without creating a new action surface

### Requirement: Board consequence feedback stays spectator-readable
The system SHALL phrase supported landing consequences in a way that lets non-acting viewers understand who was affected and what happened.

#### Scenario: A spectator watches a supported landing consequence
- **WHEN** a supported landing consequence appears on the board
- **THEN** the board SHALL expose enough concise scene-facing summary information for a spectator to understand the affected player and confirmed outcome

### Requirement: Supported landing consequences are reflected in semantic board summaries
The system SHALL expose concise semantic consequence summaries for supported landing outcomes through the board host summary surface.

#### Scenario: A supported landing consequence is active
- **WHEN** the board host summary is read by automation or assistive technologies
- **THEN** it SHALL include a concise consequence summary for the supported landing outcome