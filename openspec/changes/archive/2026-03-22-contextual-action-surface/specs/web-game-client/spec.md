# Purpose

Clarify contextual current actions on the room page.

# Requirements

### Requirement: The room page presents contextual actions for routine turn states
The system SHALL present only the actions that are relevant to the current authoritative turn step when no dedicated stage surface already owns the interaction.

#### Scenario: Player can roll normally
- **WHEN** the room is waiting on the current player to roll and no auction, trade response, or deficit recovery stage is active
- **THEN** the room page SHALL present a roll-focused action surface instead of a generic stack of unrelated disabled buttons

#### Scenario: Player decides how to leave jail
- **WHEN** the room is waiting on the current player to resolve a jail decision
- **THEN** the room page SHALL present only the jail-resolution actions and SHALL NOT show unrelated generic turn actions in the same action surface

#### Scenario: Player decides whether to buy a property
- **WHEN** the room is waiting on the current player to accept or decline a property purchase
- **THEN** the room page SHALL present the property label, price, and the purchase-or-decline decision in one contextual action surface