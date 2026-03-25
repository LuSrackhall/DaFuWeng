# Purpose

Improve board-level next-step readability after supported high-pressure closures.

# Requirements

### Requirement: BoardScene explains the next authoritative action after supported closures
The system SHALL explain the next authoritative action after supported high-pressure closures without creating a new gameplay phase.

#### Scenario: A supported closure cue is active
- **WHEN** the board is showing a supported closure for jail release, player-creditor deficit recovery, or a supported economic-chain settlement
- **THEN** the board SHALL identify the next authoritative action and the player who now owns it

### Requirement: Player-creditor deficit closure explicitly names the payee
The system SHALL distinguish player-creditor recovery from generic bank recovery in board closure guidance.

#### Scenario: A player-creditor deficit has been fully resolved
- **WHEN** the board is showing a closure cue for a fully resolved player-creditor deficit
- **THEN** it SHALL name the player payee and explain that the debt chain has been closed

### Requirement: Supported economic-chain closure is reflected in semantic board summaries
The system SHALL expose concise closure plus next-step summaries through the board host summary surface.

#### Scenario: A supported next-step closure cue is active
- **WHEN** the board host summary is read by automation or assistive technologies
- **THEN** it SHALL include a concise summary naming the closed outcome and the next authoritative action