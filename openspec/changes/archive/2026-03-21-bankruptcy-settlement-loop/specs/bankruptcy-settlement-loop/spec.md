## ADDED Requirements

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
