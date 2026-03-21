# Purpose

Define the dedicated jailed-turn decision phase and failed release roll tracking.

# Requirements

### Requirement: Jailed players enter a dedicated turn decision phase
The system MUST gate jailed turns through an authoritative jail decision state.

#### Scenario: Current turn reaches a jailed player
- **WHEN** the next active player starts a turn while still in jail
- **THEN** the room SHALL enter an explicit jail decision state instead of allowing a normal roll command

#### Scenario: Jailed player attempts a release roll and fails
- **WHEN** the jailed player submits a valid jail roll attempt and does not roll doubles
- **THEN** the backend SHALL record the failed attempt count and advance play according to the jail rules
