# Purpose

Improve the board's ability to explain authoritative roll outcomes without changing gameplay semantics.

# Requirements

### Requirement: BoardScene reveals confirmed roll outcomes inside the board
The system SHALL visually reveal a confirmed roll outcome inside the board scene after the authoritative state is available.

#### Scenario: A roll result is confirmed
- **WHEN** an authoritative roll result reaches the board scene
- **THEN** the board SHALL present a short reveal phase that communicates the confirmed dice outcome without predicting or inventing it client-side

### Requirement: BoardScene only animates movement when the path is provably safe
The system SHALL animate stepwise token movement only when the authoritative previous and next states prove a single safe forward path.

#### Scenario: A single player moves by a confirmed dice total
- **WHEN** exactly one player position changes and the dice total maps to a forward path that lands on the authoritative final tile
- **THEN** the board SHALL animate stepwise token movement along that path

#### Scenario: A movement path is ambiguous or non-standard
- **WHEN** the board cannot prove a safe forward stepwise path from the authoritative states
- **THEN** the board SHALL snap directly to the final authoritative position instead of animating an ambiguous path

### Requirement: Landing highlight and result handoff stay non-blocking
The system SHALL highlight the final landing tile and hand off to the result state without delaying the authoritative UI state.

#### Scenario: A token finishes a board movement
- **WHEN** the animated token reaches its authoritative final tile
- **THEN** the board SHALL emphasize the landing tile and transition into the confirmed result state while preserving immediate DOM semantics and actions