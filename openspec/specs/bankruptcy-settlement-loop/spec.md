# Purpose

Define authoritative bankruptcy settlement behavior for player and bank creditors.

# Requirements

### Requirement: Creditor-Aware Bankruptcy Settlement
The system SHALL resolve bankruptcy by creditor kind instead of only flagging the debtor as bankrupt.

#### Scenario: Player creditor receives assets
- **WHEN** a player declares bankruptcy while owing another player
- **THEN** the creditor receives the debtor's remaining cash, tradeable properties, mortgage flags, and held get-out cards
- **AND** the debtor is marked bankrupt and removed from future turn order

#### Scenario: Bank creditor clears assets
- **WHEN** a player declares bankruptcy while owing the bank
- **THEN** the debtor's held get-out cards are returned to the corresponding discard pile
- **AND** owned properties, mortgages, and improvements are cleared from the debtor

#### Scenario: Final active player ends the room
- **WHEN** bankruptcy leaves only one non-bankrupt player
- **THEN** the room transitions to finished

### Requirement: Bankruptcy outcomes are visible to all participants
The system SHALL present bankruptcy settlement outcomes as an explicit room resolution instead of leaving players to infer them from raw state changes.

#### Scenario: Player declares bankruptcy to another player
- **WHEN** a player resolves a deficit by declaring bankruptcy to a player creditor
- **THEN** the client SHALL explain that the creditor receives the debtor's remaining transferable assets and whether the room continues or ends

#### Scenario: Player declares bankruptcy to the bank
- **WHEN** a player resolves a deficit by declaring bankruptcy to the bank
- **THEN** the client SHALL explain that the debtor's assets are cleared or returned according to the creditor-aware settlement rules and whether the room continues or ends
