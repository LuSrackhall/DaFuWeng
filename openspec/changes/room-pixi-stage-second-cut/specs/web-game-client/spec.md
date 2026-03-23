# Purpose

Clarify the second-cut expectations for the Pixi room board stage.

# Requirements

### Requirement: The Pixi room board carries a live turn HUD
The system SHALL use the center of the Pixi room board as a live turn HUD instead of a placeholder brand card.

#### Scenario: Player opens an active room
- **WHEN** the Pixi room board renders an active room state
- **THEN** the center stage SHALL identify the current actor and the currently focused tile rather than generic implementation placeholder copy

### Requirement: The Pixi room board exposes stronger stage-state signals
The system SHALL make focused tiles, ownership state, and current-turn tokens more legible on the Pixi room board.

#### Scenario: Player reads the board after room progression
- **WHEN** the authoritative room state updates current turn, focus, or ownership
- **THEN** the Pixi room board SHALL update its stage-state signals to reflect the new board state without relying only on side-panel text