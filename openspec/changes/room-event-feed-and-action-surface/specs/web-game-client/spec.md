## MODIFIED Requirements

### Requirement: The room page presents stage-oriented guidance
The system SHALL render the room page with a stable hierarchy where room identity, stage context, and the current required action are separated into distinct surfaces.

#### Scenario: Room page shows an active authoritative stage
- **WHEN** the client renders an active room state such as auction, trade response, deficit recovery, or a routine turn decision
- **THEN** the overview card SHALL focus on room identity and current seats, the stage card SHALL explain the stage context, and the primary action anchor SHALL remain the only directive surface for the next must-do action

#### Scenario: Room page avoids duplicate top-priority guidance
- **WHEN** a stage card and the primary action anchor are visible at the same time
- **THEN** the stage card SHALL NOT repeat the primary action anchor's top-priority CTA, minimum-bid instruction, or other directive guidance that already belongs to the anchor

### Requirement: The room page exposes recent events as a player-facing feed
The system SHALL present recent authoritative events in a normal player-facing feed instead of limiting them to diagnostics-only visibility.

#### Scenario: Player reads the room after recent changes
- **WHEN** the room page renders recent authoritative events
- **THEN** the client SHALL show a recent-event feed near the main room stage so players can understand what happened without opening the diagnostics drawer

#### Scenario: Diagnostics remain technical
- **WHEN** a user opens the diagnostics drawer
- **THEN** the room page SHALL still reveal technical room metadata and raw recent events, while the player-facing event feed remains part of the normal reading surface

### Requirement: The recent-event feed supports bounded local display settings
The system SHALL let the current client tune recent-event display behavior without changing authoritative event order or room state.

#### Scenario: Player uses default recent-event settings
- **WHEN** the room page first renders the player-facing recent-event feed without a saved local preference
- **THEN** the feed SHALL default to showing the most recent 8 retained events with newer events positioned nearer the bottom of the list and the nearest event using the smallest display number

#### Scenario: Player changes recent-event display settings
- **WHEN** the player changes local recent-event display settings for ordering, near-event placement, numbering direction, or visible count
- **THEN** the room page SHALL update the feed immediately, keep the change local to that client, and preserve authoritative event content unchanged

### Requirement: The room page presents auction input as a focused bidding control
The system SHALL present the auction input in the primary action anchor as a focused bidding control rather than a generic text field.

#### Scenario: Acting bidder prepares an auction offer
- **WHEN** the current viewer is the acting bidder during an active auction
- **THEN** the primary action anchor SHALL clearly show the minimum valid bid, keep quick-bid actions visible, and block invalid or below-minimum bids with immediate feedback

#### Scenario: Non-acting viewer reads auction state
- **WHEN** the current viewer is not the acting bidder during an active auction
- **THEN** the room page SHALL explain the auction state in read-only language and SHALL NOT present the bidding control as an actionable primary input for that viewer