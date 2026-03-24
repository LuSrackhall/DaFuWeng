## Context

Recent recovery recaps are now accurate, but their anchor wording still sounds like diagnostics instead of a premium board-game client.

The stale recap also disappears correctly but too abruptly, and mobile player reconnect coverage still needs parity with the pressure phases already tested for spectators.

## Goals / Non-Goals

**Goals:**
- Replace recovery anchor wording with more player-facing copy.
- Add a soft dismissal transition before stale recaps are removed.
- Add mobile player reconnect regressions for auction, trade response, and jail decision.

**Non-Goals:**
- No reconnect system redesign.
- No backend or protocol changes.
- No new gameplay or state fields beyond recap presentation.

## Decisions

### 1. Recovery anchors should speak in game language

Replace technical labels like recovery anchors and numbered progress phrasing with copy that tells the player where the game resumed.

Why:
- Players should understand where they were brought back into the game without reading system-like terminology.

### 2. Stale recap removal should weaken before disappearing

When authoritative progress invalidates the recap, first apply a short visual de-emphasis state, then remove the recap.

Why:
- This keeps the screen calm and avoids a hard UI cut while still clearing stale context quickly.

### 3. Mobile player pressure coverage should mirror mobile spectator coverage

Add 375px reconnect regressions for:
- live auction
- trade response
- jail decision

Why:
- Players have even more pressure than spectators in these phases, so mobile reconnect must prove actionability and readability, not just spectator context.

## Risks / Trade-offs

- [Player-facing copy may become slightly longer] -> Acceptable if it stays readable and clearer than internal-style labels.
- [Soft dismissal adds small UI complexity] -> Acceptable because it improves perceived polish without changing state ownership.

## Migration Plan

1. Add OpenSpec artifacts for player-facing recovery copy and mobile pressure coverage.
2. Replace recovery anchor wording with player-facing copy.
3. Add a short soft-dismiss state before stale recap removal.
4. Add mobile player pressure reconnect regressions.
5. Verify lint and e2e remain green.