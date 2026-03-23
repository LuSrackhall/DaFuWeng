# Purpose

Clarify the stable primary action surface for the room page.

# Requirements

### Requirement: The room rail exposes a stable primary action anchor
The system SHALL present a fixed primary action anchor at the top of the room rail so players can quickly understand who acts next and what advances the room.

#### Scenario: Player opens a room state
- **WHEN** the room page renders any waiting, normal-turn, trade-response, auction, or deficit-recovery state
- **THEN** the room rail SHALL keep a primary action anchor visible before overview, assets, and diagnostics

#### Scenario: Player needs the next step
- **WHEN** the room page renders a state with a current actor and a room-advancing action
- **THEN** the primary action anchor SHALL explain who acts, what the must-do action is, and what immediate outcome follows
