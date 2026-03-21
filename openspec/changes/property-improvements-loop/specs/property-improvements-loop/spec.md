## ADDED Requirements

### Requirement: Players can build and sell evenly across a fully owned group
The system MUST allow the active player to build and sell improvements on a fully owned development group while enforcing even build rules.

#### Scenario: Player builds on a valid street group
- **WHEN** the current active player owns every street in a development group, none are mortgaged, and the target street is currently at the lowest group level
- **THEN** the backend SHALL deduct build cash, increase the target improvement level, and persist the new state

#### Scenario: Player attempts an uneven build
- **WHEN** the target street would exceed another street in the same group by more than one level
- **THEN** the backend SHALL reject the command