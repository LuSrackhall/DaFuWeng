# Purpose

Clarify spectator reconnect behavior and continue improving player-facing room copy.

# Requirements

### Requirement: Spectator reconnect stays read-only
The system SHALL keep spectator reconnect recovery in a read-only state before and after catch-up recovery.

#### Scenario: Spectator reconnects after realtime failure
- **WHEN** a spectator page loses realtime updates and later catches up through polling
- **THEN** the spectator SHALL keep seeing read-only room state and SHALL NOT gain player actions

### Requirement: High-frequency room and board copy uses player language
The system SHALL prefer player-readable game language over internal system wording on repeated room and board surfaces.

#### Scenario: Player sees room anchors and board waiting states
- **WHEN** the UI presents room anchors, turn tools, reconnect guidance, or board waiting text
- **THEN** those surfaces SHALL use player-facing game language rather than internal engineering phrasing