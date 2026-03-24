# Purpose

Clarify reconnect-success feedback and mobile spectator reconnect expectations.

# Requirements

### Requirement: Reconnect recovery shows lightweight success feedback
The system SHALL provide a lightweight success acknowledgment after room catch-up recovery completes.

#### Scenario: Room reconnect finishes catching up
- **WHEN** the room page has recovered from reconnect and caught up to the latest room state
- **THEN** the page SHALL briefly acknowledge that the room has been reconnected successfully

### Requirement: Mobile spectator reconnect stays readable and read-only
The system SHALL preserve spectator read-only recovery behavior on narrow screens.

#### Scenario: Spectator reconnects on mobile
- **WHEN** a spectator page on a narrow screen loses realtime updates and later catches up through polling
- **THEN** the spectator SHALL see reconnect recovery complete, remain read-only, and avoid horizontal overflow