## Context

The room route now has a proper loading shell, but once the route has loaded the page still drops to generic subtitle messages such as `正在同步房间状态...`.

That makes the transition feel incomplete and weakens mobile hierarchy when data is still catching up.

## Goals / Non-Goals

**Goals:**
- Make the in-page sync state feel like the next stage after the route loading shell.
- Show deterministic sync information only.
- Make the sync shell the first meaningful in-room surface on mobile while sync is incomplete.

**Non-Goals:**
- No fake gameplay state.
- No backend loading contract changes.
- No redesign of healthy room pages once sync is complete.

## Decisions

### 1. Use a dedicated in-page room sync shell

The room page will render a dedicated sync shell while loading, fallback, or realtime recovery is active.

Why:
- This keeps the transition from route loading to room sync visually coherent.

### 2. Show four deterministic sync facts

The shell should emphasize identity, room phase, sync freshness, and action availability.

Why:
- These answer the player's most important questions without inventing state.

### 3. Add a mobile slow-data regression

The mobile regression should prove that the route shell disappears, the in-page sync shell becomes visible and prioritized, and the layout avoids horizontal overflow.

Why:
- Mobile is the highest-risk place for this hierarchy to collapse.

## Risks / Trade-offs

- [The room page shows more status structure during sync] -> Acceptable because it replaces ambiguity with useful state.
- [The sync shell may feel verbose if it remains visible too long] -> Acceptable because it only appears for loading, fallback, or realtime recovery states.

## Migration Plan

1. Add OpenSpec artifacts for the room sync shell and mobile regression.
2. Replace loose page sync subtitles with a dedicated room sync shell.
3. Add a mobile slow-data Playwright regression.
4. Verify lint and e2e remain green.