# Purpose

Clarify mobile first-screen decision priority for the web room page.

# Requirements

### Requirement: The mobile room page presents the current stage before the board
The system SHALL prioritize the current authoritative room stage above the board on narrow screens.

#### Scenario: Player opens a mobile room with an active decision
- **WHEN** the room page is rendered in a narrow mobile viewport and the room has a current stage to explain
- **THEN** the room-state panel SHALL appear before the board panel in the page reading flow so the player reaches the active decision surface first
