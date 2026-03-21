## ADDED Requirements

### Requirement: The web client presents an authoritative multiplayer game view
The system SHALL provide a web client that renders room flows, the board scene, player state, action prompts, and event feedback using authoritative backend state as its input.

#### Scenario: Player enters an active room
- **WHEN** a player opens or rejoins an active room in the web client
- **THEN** the client SHALL render the current room and match state from the latest authoritative snapshot and event stream

#### Scenario: Turn feedback is shown during gameplay
- **WHEN** gameplay state changes on the backend
- **THEN** the client SHALL update visible turn indicators, board state, player finances, and recent event feedback so players can understand what happened

### Requirement: Presentation state is separate from gameplay truth
The system MUST separate local UI or animation state from authoritative gameplay state so that reconnects, refreshes, and cross-platform reuse do not corrupt business logic.

#### Scenario: Client refreshes during a match
- **WHEN** the web client reloads during an in-progress game
- **THEN** the client SHALL reconstruct the visible game state from authoritative backend data rather than from stale local component state

#### Scenario: Animation runs after a resolved action
- **WHEN** the client receives an authoritative action result such as movement or rent payment
- **THEN** the client MAY animate that result locally without changing the underlying authoritative values

### Requirement: The board and rule presentation are configuration driven
The system SHALL load board layout, tile presentation, labels, and rule-linked content from shared configuration rather than hardcoding them into view components.

#### Scenario: Client renders tile metadata
- **WHEN** the board scene renders a tile or card-dependent interaction
- **THEN** the client SHALL resolve its display metadata through shared board or rule configuration

#### Scenario: Shared configuration changes
- **WHEN** a supported board or rule configuration is updated
- **THEN** the client SHALL be able to reflect that configuration without requiring gameplay logic to be rewritten in UI components
