# Purpose

Define the web-first authoritative multiplayer client experience and presentation boundaries.

# Requirements

### Requirement: The web client presents an authoritative multiplayer game view
The system SHALL provide a web client that renders room flows, the board scene, player state, action prompts, and event feedback using authoritative backend state as its input.

#### Scenario: Player enters an active room
- **WHEN** a player opens or rejoins an active room in the web client
- **THEN** the client SHALL render the current room and match state from the latest authoritative snapshot and event stream, plus the player's joined-seat state when a valid room-scoped player session is present

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

### Requirement: Formal room flows never silently fall back to local demo gameplay
The system MUST distinguish between a real authoritative room, a reconnectable joined room, and an unavailable room state.

#### Scenario: Backend room is unavailable
- **WHEN** the web client fails to load a requested room from the backend
- **THEN** the client SHALL show an explicit loading or failure state instead of substituting local sample gameplay

#### Scenario: Viewer opens a room without a joined-seat session
- **WHEN** the web client loads a real room but does not hold a valid room-scoped player session for that room
- **THEN** the client SHALL render the room in a read-only state and SHALL NOT default command privileges to the current turn player

### Requirement: The room page presents stage-oriented guidance
The system SHALL render waiting-room, active turn, and forced-resolution states using explicit stage summaries instead of mostly raw state labels.

#### Scenario: Waiting room is rendered
- **WHEN** the client loads a room that has not started
- **THEN** it SHALL show a dedicated waiting-room summary that explains room identity, host authority, seat presence, and the next step to start

#### Scenario: Forced resolution pauses the room
- **WHEN** the client renders a pending deficit or bankruptcy-capable state
- **THEN** it SHALL explain who owes whom, why the room is paused, what the acting player can do next, and what outcome ends the pause

### Requirement: The room page gives auction a dominant stage surface
The system SHALL elevate auction into the room page's primary stage surface while it is active.

#### Scenario: Auction is active
- **WHEN** the room is waiting on bids or passes for a pending auction
- **THEN** the room page SHALL prioritize auction state, controls, and outcomes above secondary status panels

#### Scenario: Auction settles
- **WHEN** the auction ends with a winning bidder or no sale
- **THEN** the room page SHALL explain the settlement outcome and transition cleanly back to the next authoritative room step

### Requirement: The room page gives trade a dominant stage surface
The system SHALL elevate pending trade into the room page's primary stage surface while a response is outstanding.

#### Scenario: Pending trade is active
- **WHEN** the room is waiting on a trade response
- **THEN** the room page SHALL prioritize the trade summary, response controls, and outcome guidance above secondary panels

#### Scenario: Trade resolves
- **WHEN** the pending trade is accepted or rejected
- **THEN** the room page SHALL explain the result and transition cleanly back to the next authoritative room step

### Requirement: Technical room state is available through a diagnostics drawer
The system SHALL keep technical room information accessible without letting it dominate the main player-facing surface.

#### Scenario: Player opens diagnostics
- **WHEN** a user expands the diagnostics drawer
- **THEN** the room page SHALL reveal snapshot version, event sequence, deck state, recent events, and current technical room context

#### Scenario: Diagnostics are collapsed
- **WHEN** the diagnostics drawer is closed
- **THEN** the main room surface SHALL continue to emphasize player-facing guidance instead of technical metadata

### Requirement: The trade proposal surface exposes real asset pools
The system SHALL present visible asset pools for both sides of a proposed trade while a proposer is composing an offer.

#### Scenario: Proposer prepares a trade offer
- **WHEN** the current turn player opens the trade proposal surface
- **THEN** the room page SHALL show who the offer targets, what assets the proposer can offer, what assets the target can be asked to give up, and how the current draft changes the bilateral trade summary

#### Scenario: Trade draft updates
- **WHEN** the proposer selects or deselects a property or card in the trade proposal surface
- **THEN** the room page SHALL update the visible trade summary without requiring manual asset identifier entry

### Requirement: The room page explains an unsold auction outcome
The system SHALL surface a clear recent result when an auction ends without a winner.

#### Scenario: Auction ends unsold
- **WHEN** the room receives an authoritative `auction-ended-unsold` outcome
- **THEN** the room page SHALL explain that the lot remained unsold, ownership did not change, and the room has already advanced to the next authoritative step

### Requirement: The room page presents a readable deficit recovery panel
The system SHALL present a recovery-oriented room stage when a player is resolving a forced payment deficit.

#### Scenario: Deficit recovery is active
- **WHEN** the room is waiting on the deficit player to mortgage assets or declare bankruptcy
- **THEN** the room page SHALL explain the debt, show who may act, present visible recovery assets with readable action consequences, and keep non-acting viewers in a clear read-only state

### Requirement: The mobile room page prioritizes the current stage
The system SHALL emphasize the current authoritative room stage above supporting overview detail on narrow screens.

#### Scenario: Player opens the room page on mobile
- **WHEN** the room page is rendered in a narrow mobile viewport
- **THEN** the current stage card SHALL appear before the overview card in the main reading flow and SHALL remain the dominant decision surface

### Requirement: Mobile room-stage actions remain readable without horizontal pressure
The system SHALL keep stage actions and asset groups readable on narrow screens.

#### Scenario: Mobile player reviews a dense stage
- **WHEN** the room page renders auction, trade, or deficit recovery content on a mobile viewport
- **THEN** the client SHALL present stage details, actions, and asset selections in a single readable column without requiring horizontal scrolling

### Requirement: The mobile room page presents the current stage before the board
The system SHALL prioritize the current authoritative room stage above the board on narrow screens.

#### Scenario: Player opens a mobile room with an active decision
- **WHEN** the room page is rendered in a narrow mobile viewport and the room has a current stage to explain
- **THEN** the room-state panel SHALL appear before the board panel in the page reading flow so the player reaches the active decision surface first

### Requirement: The board and rule presentation are configuration driven
The system SHALL load board layout, tile presentation, labels, and rule-linked content from shared configuration rather than hardcoding them into view components.

#### Scenario: Client renders tile metadata
- **WHEN** the board scene renders a tile or card-dependent interaction
- **THEN** the client SHALL resolve its display metadata through shared board or rule configuration

#### Scenario: Shared configuration changes
- **WHEN** a supported board or rule configuration is updated
- **THEN** the client SHALL be able to reflect that configuration without requiring gameplay logic to be rewritten in UI components
