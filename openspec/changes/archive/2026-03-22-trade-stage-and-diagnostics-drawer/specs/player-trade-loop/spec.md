# Purpose

Clarify the authoritative two-player trade loop for room-page presentation.

# Requirements

### Requirement: Pending trade is human-readable to all room viewers
The system SHALL present enough pending trade information for proposer, counterparty, and observers to understand who is waiting, what is being exchanged, and who may act.

#### Scenario: Counterparty reviews a pending trade
- **WHEN** the room enters `awaiting-trade-response`
- **THEN** the client SHALL show the proposer, the counterparty, the offered cash and assets, the requested cash and assets, and whether the current viewer may accept or reject the trade

#### Scenario: Observer watches a pending trade
- **WHEN** a joined player or spectator is not the proposer or counterparty during a pending trade
- **THEN** the client SHALL explain that the room is paused on a trade response and that the viewer is currently read-only
