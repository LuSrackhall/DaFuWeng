## ADDED Requirements

### Requirement: Held release cards survive reconnect and are returned after use
The system SHALL persist which player currently holds a release card and restore that state across reconnect.

#### Scenario: Player uses a held release card
- **WHEN** a jailed player submits a valid release-card command
- **THEN** the backend SHALL remove the card from the player's held cards, release the player from jail, and return the card to the correct discard pile
