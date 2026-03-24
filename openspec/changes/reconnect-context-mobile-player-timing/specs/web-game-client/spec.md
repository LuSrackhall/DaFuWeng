# Purpose

Clarify reconnect success context and mobile player reconnect timing expectations.

# Requirements

### Requirement: Reconnect success explains recovered room context
The system SHALL pair reconnect success feedback with key recovered room context.

#### Scenario: Player reconnect succeeds
- **WHEN** a room reconnect succeeds after catch-up recovery
- **THEN** the success feedback SHALL briefly explain the recovered room context, such as the recovered event summary or the current acting player

### Requirement: Mobile player reconnect keeps success feedback lightweight
The system SHALL keep reconnect success feedback lightweight on narrow screens while preserving the current primary action.

#### Scenario: Player reconnects on mobile
- **WHEN** a player page on a narrow screen recovers from reconnect
- **THEN** the success strip SHALL appear briefly, remain visible long enough to notice, dismiss automatically, and preserve the recovered current primary action without horizontal overflow