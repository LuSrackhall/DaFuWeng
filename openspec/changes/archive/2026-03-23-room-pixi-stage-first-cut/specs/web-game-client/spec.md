# Purpose

Clarify the first playable Pixi board cut for the web room.

# Requirements

### Requirement: The board stage renders through Pixi
The system SHALL render the playable room board through a Pixi stage instead of a static DOM tile grid.

#### Scenario: Player opens the room board
- **WHEN** a player enters a room page
- **THEN** the board region SHALL mount a Pixi canvas that renders the board stage inside the existing scene boundary

#### Scenario: Player reads board focus
- **WHEN** the room stage is rendered with a current player and highlighted tile
- **THEN** the board SHALL visually distinguish player positions, current-turn emphasis, and the current highlighted tile without relying only on side-panel text
