# Purpose

Clarify reconnect recovery narrative behavior across more decision-heavy branches.

# Requirements

### Requirement: Reconnect success provides a recovery narrative
The system SHALL explain both the recovered change and the current action context when reconnect success feedback appears.

#### Scenario: Ordinary reconnect succeeds
- **WHEN** reconnect success feedback appears after catch-up recovery
- **THEN** the feedback SHALL explain the recovered update and the current ordinary turn context

#### Scenario: Property decision reconnect succeeds
- **WHEN** reconnect success feedback appears while the room has recovered into property decision
- **THEN** the feedback SHALL explain the recovered property decision context

#### Scenario: Deficit recovery reconnect succeeds
- **WHEN** reconnect success feedback appears while the room has recovered into deficit resolution
- **THEN** the feedback SHALL explain the recovered deficit context

### Requirement: Reconnect success falls back gracefully without event summary
The system SHALL still provide actionable reconnect success context when no latest event summary exists.

#### Scenario: No recent event summary is available
- **WHEN** reconnect success feedback appears but the recovered room has no latest event summary
- **THEN** the feedback SHALL fall back to the current acting player or decision context instead of showing an empty or placeholder summary