## Why

The authoritative loop now covers property, rent, auctions, and minimal special tiles, but tax spaces still do not enforce a real economic pressure loop. Players can also end up with negative cash without entering an explicit recovery state.

This change adds fixed tax resolution and an authoritative deficit state so the room can stop play safely when a player cannot satisfy a required payment.

## What Changes

- Add authoritative fixed tax resolution for tax tiles.
- Introduce a persisted pending payment state when a player cannot afford a required tax payment.
- Block normal progression until the current deficit player resolves the payment through a later recovery command.
- Extend events, snapshots, projection logic, and tests for deficit-safe recovery.