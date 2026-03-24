# Purpose

Make recent recovery recaps easier to trust and extend mobile spectator pressure-phase reconnect coverage.

# Requirements

### Requirement: Recent recovery recaps indicate their authoritative anchor
The system SHALL show which authoritative room context a recent recovery recap came from.

#### Scenario: A recovery recap is visible
- **WHEN** a recent recovery recap is shown in the room overview
- **THEN** it SHALL indicate the authoritative phase or sequence anchor that the recap refers to

### Requirement: Stale recovery recaps clear after room progress advances
The system SHALL remove recent recovery recaps once they no longer match the latest authoritative room progress.

#### Scenario: Authoritative progress advances beyond the recap anchor
- **WHEN** the room receives newer authoritative progress than the recap anchor
- **THEN** the stale recap SHALL be removed instead of remaining as an outdated context hint

### Requirement: Mobile spectator reconnect remains perceptible during pressure phases
The system SHALL keep spectator reconnect feedback readable on narrow screens during decision-heavy phases.

#### Scenario: Mobile spectator reconnects during live auction
- **WHEN** a spectator reconnects on a narrow screen during a live auction
- **THEN** reconnect feedback and the follow-up recap SHALL remain readable without enabling spectator actions or causing horizontal overflow

#### Scenario: Mobile spectator reconnects during trade response
- **WHEN** a spectator reconnects on a narrow screen during a trade response
- **THEN** reconnect feedback and the follow-up recap SHALL remain readable without enabling spectator actions or causing horizontal overflow

#### Scenario: Mobile spectator reconnects during jail decision
- **WHEN** a spectator reconnects on a narrow screen during a jail decision
- **THEN** reconnect feedback and the follow-up recap SHALL remain readable without enabling spectator actions or causing horizontal overflow