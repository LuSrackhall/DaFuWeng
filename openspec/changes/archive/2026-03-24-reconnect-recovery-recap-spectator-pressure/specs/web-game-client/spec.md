# Purpose

Keep recent reconnect context lightly reviewable and extend spectator pressure-phase reconnect coverage.

# Requirements

### Requirement: Reconnect context remains lightly reviewable after dismissal
The system SHALL preserve a lightweight recent recovery recap after the reconnect success strip disappears.

#### Scenario: Reconnect success strip dismisses
- **WHEN** reconnect success feedback has finished its transient display
- **THEN** the room overview SHALL preserve a lightweight recap of the most recent recovery context without recreating the full transient strip

### Requirement: Spectator reconnect stays perceptible during pressure phases
The system SHALL keep reconnect recovery context perceptible for spectators during decision-heavy room phases.

#### Scenario: Spectator reconnects during live auction
- **WHEN** a spectator reconnects while the room is in a live auction
- **THEN** reconnect feedback and the follow-up recap SHALL explain the auction context while preserving spectator read-only behavior

#### Scenario: Spectator reconnects during trade response
- **WHEN** a spectator reconnects while the room is waiting on a trade response
- **THEN** reconnect feedback and the follow-up recap SHALL explain the waiting counterparties while preserving spectator read-only behavior

#### Scenario: Spectator reconnects during jail decision
- **WHEN** a spectator reconnects while the room is waiting on a jail decision
- **THEN** reconnect feedback and the follow-up recap SHALL explain the jail context while preserving spectator read-only behavior