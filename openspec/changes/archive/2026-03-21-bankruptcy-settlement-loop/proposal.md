## Why

The current bankruptcy flow only marks a player bankrupt. It does not complete creditor-facing asset settlement, held-card disposition, or endgame closure in a deterministic way.

## What Changes

- Add creditor-aware bankruptcy settlement for bank and player creditors.
- Transfer cash, properties, mortgages, and held get-out cards to player creditors.
- Return held cards to deck discard piles when the bank is the creditor.
- Liquidate improvements during bankruptcy and close the room when one active player remains.

## Impact

- Backend room rules, persistence, and replay events
- Frontend projection replay for bankruptcy settlement
- Integration coverage for creditor settlement and deck recovery
