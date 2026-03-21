## ADDED Requirements

### Requirement: Rich Deterministic Card Effects
The system SHALL support richer non-interactive card effects that remain server authoritative and replay-safe.

#### Scenario: Relative move chains into landing logic
- **WHEN** a player draws a relative movement card
- **THEN** the player is moved by the specified offset
- **AND** the destination tile resolves through the standard landing pipeline

#### Scenario: Nearest railway move resolves deterministically
- **WHEN** a player draws a nearest railway card
- **THEN** the player is moved to the next railway tile in board order

#### Scenario: Card payment enters deficit recovery
- **WHEN** a player draws a card that charges more cash than they hold
- **THEN** the room enters deficit recovery with reason `card`
