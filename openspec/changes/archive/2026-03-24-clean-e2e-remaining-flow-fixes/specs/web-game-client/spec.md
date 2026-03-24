# Purpose

Keep the clean full-suite Playwright gate aligned with the current authoritative room flow.

# Requirements

### Requirement: Clean spectator reconnect coverage remains deterministic on mobile
The system SHALL keep the mobile spectator reconnect coverage stable under the clean e2e lane.

#### Scenario: Mobile spectator reconnect coverage validates read-only recovery
- **WHEN** the clean e2e suite validates mobile spectator reconnect recovery
- **THEN** the test SHALL use a deterministic recovery baseline that still proves read-only recovery feedback and overflow safety

### Requirement: Clean live trade coverage respects the current authoritative turn model
The system SHALL validate live trade response and rejection flows only after the proposer regains an authoritative turn that can open turn tools.

#### Scenario: The clean suite validates a live trade response flow
- **WHEN** the proposer reaches the next authoritative turn after the opponent acts
- **THEN** the suite SHALL validate the live trade response flow from that turn

#### Scenario: The clean suite validates a rejected trade flow
- **WHEN** the proposer reaches the next authoritative turn after the opponent acts
- **THEN** the suite SHALL validate the rejected trade flow from that turn