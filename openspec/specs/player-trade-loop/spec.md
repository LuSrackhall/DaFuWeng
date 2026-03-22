# Purpose

Define a minimal authoritative two-player trade loop for cash, properties, and held get-out cards.

# Requirements

### Requirement: Authoritative Two-Player Trade Loop
The system SHALL support a single pending two-player trade offer that is resolved authoritatively by the server.

#### Scenario: Proposer creates a pending trade
- **WHEN** the current turn player proposes a trade to another active player during `awaiting-roll`
- **THEN** the room enters `awaiting-trade-response`
- **AND** the counterparty can accept or reject the offer

#### Scenario: Counterparty accepts the trade
- **WHEN** the counterparty accepts a valid pending trade
- **THEN** the offered and requested cash and assets are exchanged atomically
- **AND** the proposer resumes their turn in `awaiting-roll`

#### Scenario: Improved group blocks property trade
- **WHEN** a player tries to trade a property whose color group still contains improvements
- **THEN** the trade is rejected by the server

### Requirement: Pending trade is human-readable to all room viewers
The system SHALL present enough pending trade information for proposer, counterparty, and observers to understand who is waiting, what is being exchanged, and who may act.

#### Scenario: Counterparty reviews a pending trade
- **WHEN** the room enters `awaiting-trade-response`
- **THEN** the client SHALL show the proposer, the counterparty, the offered cash and assets, the requested cash and assets, and whether the current viewer may accept or reject the trade

#### Scenario: Observer watches a pending trade
- **WHEN** a joined player or spectator is not the proposer or counterparty during a pending trade
- **THEN** the client SHALL explain that the room is paused on a trade response and that the viewer is currently read-only
