## Why

Chance and community spaces still resolve as hardcoded tile effects. That is enough for early smoke coverage, but it does not create a real deck, cannot support held release cards, and does not survive reconnect as an explicit deck state.

This change introduces authoritative deck-backed card resolution with held release cards.

## What Changes

- Add finite chance and community decks with persisted draw and discard piles.
- Resolve card spaces by drawing the next authoritative card instead of using hardcoded tile effects.
- Support held get-out-of-jail cards and return them to the correct deck when used.
- Extend events, snapshots, projection logic, and tests for deck-backed recovery.
