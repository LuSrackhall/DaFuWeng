---
description: "Use when creating or modifying backend, PocketBase collections, Go services, room state, realtime flows, persistence, matchmaking, or anti-cheat logic for the Monopoly project."
name: "Backend PocketBase Instruction"
applyTo: "backend/**"
---

# Backend And PocketBase Guidelines

- The backend is authoritative for room lifecycle, turn progression, dice resolution, ownership, cash updates, auctions, jail rules, cards, bankruptcy, and game end conditions.
- Use PocketBase for identity, collections, realtime subscriptions, and lightweight admin capabilities.
- Put core rule orchestration in Go, not only in collection hooks or only in the client.
- Design for resumable multiplayer sessions and reconnect-safe state restoration.

## Data Design

- Keep collections normalized enough for admin inspection, but store room snapshots or event logs in shapes that allow deterministic reconstruction.
- Version room state and major payload schemas.
- Avoid hidden write paths. Commands that mutate game state should be explicit and auditable.

## API And Realtime

- Prefer server-issued events with stable event names and payload contracts.
- Validate turn ownership and preconditions on every mutating request.
- Include idempotency or replay protection where repeated client submissions are possible.
- Treat bots, reconnects, and late subscribers as supported scenarios, not edge cases.

## Operational Expectations

- Keep room cleanup, stale session recovery, and admin inspection in mind from the start.
- Document any PocketBase migration or data backfill required by a change.