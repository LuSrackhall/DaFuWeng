# Purpose

Define the authoritative and refresh-safe recovery loop for rent debt owed from one player to another.

# Requirements

## Requirement: Unaffordable rent enters a refresh-safe deficit stage

The system SHALL enter an authoritative deficit stage when a player cannot afford rent owed to another player, and that stage SHALL survive refresh and reconnect.

### Scenario: A player cannot pay another player's rent

- **WHEN** an acting player lands on an owned tile and the required rent exceeds the player's available cash
- **THEN** the room SHALL pause normal turn flow, record the debt as player-creditor rent deficit, and preserve the acting debtor, creditor, amount, and recovery context in the authoritative snapshot

## Requirement: Rent deficit recovery keeps permissions and exits coherent

The system SHALL allow only the debtor to continue the rent deficit recovery loop until the debt is settled or the debtor is bankrupt.

### Scenario: The debtor refreshes during rent deficit recovery

- **WHEN** the current debtor refreshes or reconnects during rent deficit recovery
- **THEN** the client SHALL restore the same debtor identity, the same player creditor, the remaining debt context, and the same actionable recovery stage

### Scenario: Another player refreshes during rent deficit recovery

- **WHEN** a non-debtor player refreshes or reconnects during rent deficit recovery
- **THEN** the client SHALL restore the same room stage as read-only context and SHALL NOT grant recovery actions to that player

### Scenario: The debtor resolves the rent deficit

- **WHEN** the debtor completes a valid recovery action that fully settles the debt or declares bankruptcy
- **THEN** the system SHALL exit the deficit stage exactly once and continue with the correct post-settlement authoritative room state