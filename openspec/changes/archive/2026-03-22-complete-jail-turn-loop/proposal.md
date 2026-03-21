## Why

The current jail loop only supports paying a fixed fine before rolling again. That is enough for a smoke test, but it does not model a real Monopoly turn gate and does not support repeated attempts or held release cards.

This change upgrades jail into a real turn sub-loop with explicit decisions and reconnect-safe state.

## What Changes

- Add a dedicated jail decision turn state for the active jailed player.
- Allow jailed players to attempt a release roll, pay the fine, or later use a held release card.
- Persist jail attempt counts and any release-relevant state across refresh and restart.
- Extend events, projection logic, and tests for the full jail turn loop.
