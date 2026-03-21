## Design

Bankruptcy stays server authoritative and is only reachable from pending deficit resolution.

When the creditor is a player:
- transfer all remaining cash to the creditor
- transfer owned properties and their mortgage flags
- transfer held get-out cards
- clear improvement levels before transfer completes

When the creditor is the bank:
- clear owned properties and mortgages back to the bank
- return held get-out cards into the correct discard pile
- clear improvement levels

Replay is driven by enriched room events so SSE subscribers and catch-up readers converge without a forced snapshot refresh.
