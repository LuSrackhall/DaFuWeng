# Purpose

Make reconnect success feedback easier to notice and robust across repeated recoveries.

# Requirements

### Requirement: Reconnect success remains noticeable on mobile
The system SHALL keep reconnect success feedback perceptible on narrow screens without obscuring the current action context.

#### Scenario: Mobile reconnect succeeds
- **WHEN** reconnect success feedback appears on a narrow screen
- **THEN** the feedback SHALL remain visible long enough to notice, stay within the viewport, and preserve the nearby current action context

### Requirement: Repeated reconnects retrigger success feedback cleanly
The system SHALL treat each reconnect success as a new display event.

#### Scenario: A second reconnect succeeds before the first notice fully ages out
- **WHEN** reconnect success occurs again during a later recovery
- **THEN** the success feedback SHALL refresh to the newest context and restart its display lifetime instead of being swallowed by the earlier notice state