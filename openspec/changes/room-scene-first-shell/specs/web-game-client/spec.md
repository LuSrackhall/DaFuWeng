# Purpose

Clarify the room page shell hierarchy for the playable web client.

# Requirements

### Requirement: The room page uses a scene-first shell
The system SHALL present the playable room route through a dedicated scene-first shell instead of the generic lobby shell.

#### Scenario: Player enters a real room
- **WHEN** a player opens a room route
- **THEN** the page SHALL present a lightweight room top bar, a primary board stage, and a secondary room rail instead of the lobby hero shell

#### Scenario: Player needs the current action
- **WHEN** the room page renders an active room stage
- **THEN** the room rail SHALL prioritize the current stage and primary action before overview, assets, or diagnostics