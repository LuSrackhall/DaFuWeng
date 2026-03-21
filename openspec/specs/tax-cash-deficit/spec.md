# Purpose

Define authoritative tax resolution and deficit entry.

# Requirements

### Requirement: Tax tiles create authoritative forced payments
The system MUST resolve tax tiles as fixed required payments.

#### Scenario: Player can afford the tax
- **WHEN** a valid roll ends on a tax tile and the acting player has enough cash
- **THEN** the backend SHALL deduct the tax, append ordered events, and advance normal turn flow

#### Scenario: Player cannot afford the tax
- **WHEN** a valid roll ends on a tax tile and the acting player lacks sufficient cash
- **THEN** the backend SHALL enter an authoritative deficit state and SHALL NOT advance normal turn flow until the payment is resolved or the player is bankrupt
