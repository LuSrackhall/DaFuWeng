# Purpose

Clarify mobile-first room-stage readability for the web client.

# Requirements

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