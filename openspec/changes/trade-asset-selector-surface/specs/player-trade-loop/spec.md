# Purpose

Clarify selector-based trade proposal entry for the authoritative two-player trade loop.

# Requirements

### Requirement: Trade proposal uses readable asset selection
The system SHALL let a proposer compose a trade using visible assets instead of raw internal asset identifiers.

#### Scenario: Proposer selects their own offered assets
- **WHEN** the current turn player prepares a trade offer
- **THEN** the client SHALL show the player's available tradeable properties and held cards as readable selectable assets

#### Scenario: Proposer requests assets from the counterparty
- **WHEN** the current turn player chooses a counterparty for a trade
- **THEN** the client SHALL show the counterparty's visible requestable properties and held cards as readable selectable assets

### Requirement: Blocked trade assets remain visible with a reason
The system SHALL show known blocked assets as disabled instead of requiring players to infer why they cannot be traded.

#### Scenario: Property is blocked by improvements
- **WHEN** a property's color group still contains improvements and the client can determine that it is not currently tradeable
- **THEN** the property SHALL remain visible in the selector but SHALL be disabled with a readable reason