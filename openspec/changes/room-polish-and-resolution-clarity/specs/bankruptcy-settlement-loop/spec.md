# Purpose

Clarify creditor-aware bankruptcy outcomes for players in the room.

# Requirements

### Requirement: Bankruptcy outcomes are visible to all participants
The system SHALL present bankruptcy settlement outcomes as an explicit room resolution instead of leaving players to infer them from raw state changes.

#### Scenario: Player declares bankruptcy to another player
- **WHEN** a player resolves a deficit by declaring bankruptcy to a player creditor
- **THEN** the client SHALL explain that the creditor receives the debtor's remaining transferable assets and whether the room continues or ends

#### Scenario: Player declares bankruptcy to the bank
- **WHEN** a player resolves a deficit by declaring bankruptcy to the bank
- **THEN** the client SHALL explain that the debtor's assets are cleared or returned according to the creditor-aware settlement rules and whether the room continues or ends