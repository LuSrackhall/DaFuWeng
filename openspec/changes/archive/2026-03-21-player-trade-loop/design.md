## Design

Trading is modeled as a room-level pending offer.

- Only one offer may exist at a time.
- The proposer must be the current turn player in `awaiting-roll`.
- The counterparty becomes the active responder while the room is in `awaiting-trade-response`.
- Acceptance atomically exchanges cash, properties, mortgage flags, and held get-out cards.
- Rejection clears the offer and restores the proposer's turn.

Improved properties are not tradeable while their color group contains any improvements, keeping development state deterministic without forced liquidation inside the trade command.
