# Purpose

Improve the first-pass play-surface experience without changing gameplay semantics.

# Requirements

### Requirement: The roll phase feels like a clear stage entrance
The system SHALL present the waiting-roll state as the primary visual entrance of the current turn without changing the underlying authoritative roll command.

#### Scenario: The active player reaches the waiting-roll phase
- **WHEN** the active player reaches the waiting-roll phase
- **THEN** the room page SHALL emphasize the roll action as the dominant primary action surface while preserving the existing roll command semantics

### Requirement: The board keeps first-visual priority during active play
The system SHALL present the board as the dominant play surface, with dense room-state information acting as a supporting layer.

#### Scenario: A player views an active room on desktop
- **WHEN** an active room is shown on desktop-sized layouts
- **THEN** the board SHALL receive more visual space than the room-state rail

### Requirement: The center board overlay remains readable on tighter layouts
The system SHALL keep the center board overlay concise enough to avoid visually crowding the play surface as the viewport tightens.

#### Scenario: The board is rendered on a tighter layout
- **WHEN** the board is rendered in a tighter viewport or smaller board stage
- **THEN** the center overlay SHALL reduce its persistent information density instead of stacking overlapping visual panels in the middle of the board