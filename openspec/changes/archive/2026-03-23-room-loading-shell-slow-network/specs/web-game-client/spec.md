# Purpose

Clarify room-entry loading behavior under lazy route loads and slow room snapshots.

# Requirements

### Requirement: Room route loading shells show room-entry context
The system SHALL display deterministic room-entry context while a room route chunk is still loading.

#### Scenario: Player cold-loads a room route
- **WHEN** the room route chunk is still being fetched
- **THEN** the loading shell SHALL show the room id, sync stages, and whether the player is restoring an active room session or entering as read-only

### Requirement: Route loading and data loading remain distinct
The system SHALL use different loading surfaces for route-chunk delay and room-snapshot delay.

#### Scenario: Route chunk is slow but room snapshot is not yet requested
- **WHEN** the room page JavaScript chunk is still loading
- **THEN** the user SHALL see the room-route loading shell

#### Scenario: Route chunk has loaded but room snapshot is slow
- **WHEN** the room page has mounted but the room snapshot request is still pending
- **THEN** the user SHALL see the room page's room-sync loading state instead of the route loading shell