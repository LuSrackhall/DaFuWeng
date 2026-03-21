## ADDED Requirements

### Requirement: Jail blocks rolling until release is resolved
The system MUST require jailed current players to resolve jail before rolling again.

#### Scenario: Player lands on go-to-jail
- **WHEN** a valid roll ends on the `去监狱` tile
- **THEN** the backend SHALL move the player to jail, mark them as jailed, append ordered room events, and continue normal turn advancement

#### Scenario: Jailed player's turn begins
- **WHEN** the next current turn player is in jail
- **THEN** the room SHALL enter `awaiting-jail-release` until the player pays the configured fine

#### Scenario: Jailed player pays the release fine
- **WHEN** the current jailed player submits a valid jail release command
- **THEN** the backend SHALL deduct the fine, clear jail state, and return the room to `awaiting-roll` for that same player
