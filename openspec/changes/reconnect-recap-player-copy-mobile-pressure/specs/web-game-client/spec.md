# Purpose

Make recent recovery recaps sound more like the game and extend mobile player pressure-phase reconnect coverage.

# Requirements

### Requirement: Recent recovery recaps use player-facing game language
The system SHALL describe recovery anchors in player-facing game language instead of internal-style recovery terminology.

#### Scenario: A recent recovery recap is shown
- **WHEN** the room overview shows a recent recovery recap
- **THEN** the anchor copy SHALL explain where the player or spectator was brought back into the game using game-facing language

### Requirement: Stale recovery recaps dismiss softly before removal
The system SHALL weaken stale recent recovery recaps briefly before removing them from the overview.

#### Scenario: Authoritative progress invalidates a visible recap
- **WHEN** newer authoritative progress makes the current recap stale
- **THEN** the recap SHALL briefly de-emphasize before it is removed

### Requirement: Mobile player reconnect remains actionable during pressure phases
The system SHALL keep reconnect feedback readable and actionable on narrow screens during decision-heavy phases.

#### Scenario: Mobile player reconnects during live auction
- **WHEN** a player reconnects on a narrow screen during a live auction
- **THEN** reconnect feedback SHALL remain readable and the player SHALL be able to continue auction actions without horizontal overflow

#### Scenario: Mobile player reconnects during trade response
- **WHEN** a player reconnects on a narrow screen during a trade response
- **THEN** reconnect feedback SHALL remain readable and the player SHALL be able to continue the response actions without horizontal overflow

#### Scenario: Mobile player reconnects during jail decision
- **WHEN** a player reconnects on a narrow screen during a jail decision
- **THEN** reconnect feedback SHALL remain readable and the player SHALL be able to continue the jail decision actions without horizontal overflow