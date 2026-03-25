## Context

The room service already enforces a four-player maximum and supports multi-player turn rotation, but the strongest real-browser evidence in the repository still centers on two-player flows.

This pass adds thin but meaningful browser validation for 3-player synchronization and 4-player capacity behavior.

## Goals / Non-Goals

**Goals:**
- Prove that 3-player rooms can create, join, start, rotate turns, and keep all pages synchronized.
- Prove that 4-player rooms can fill successfully and reject a fifth joiner.
- Keep the tests thin so failures isolate room-capacity and synchronization issues quickly.

**Non-Goals:**
- No new gameplay rules.
- No long multi-round economic, jail, or trade chains.
- No cross-platform shell validation.

## Decisions

### 1. Prefer thin smoke journeys over long multiplayer sagas

The tests focus on create, join, start, short turn progression, and full-room rejection rather than full-length 3-player or 4-player matches.

### 2. Reuse the real authoritative browser flow

The tests continue to use the real Playwright room flow against the Go backend instead of mocked projection-only snapshots.

### 3. Assert shared room truth across pages

The strongest assertions target room count, turn handoff, authoritative board aria updates, and full-room rejection.

## Validation Strategy

1. Run the targeted Playwright tests with isolated backend and frontend ports.
2. Confirm all pages converge on the same current-turn semantics after each short turn step.
3. Confirm a fifth join attempt is rejected once a 4-player room is full.