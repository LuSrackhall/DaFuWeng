## Context

The room sync shell already covers in-page loading and fallback, but the reconnect-only branch still relies on indirect confidence rather than a dedicated automated test.

Meanwhile, some of the sync shell copy still reads like internal transport language instead of player-facing room guidance.

## Goals / Non-Goals

**Goals:**
- Validate the realtime reconnect error-only path directly.
- Distinguish reconnect state from first-load and fallback states.
- Reduce engineering jargon in the sync shell.

**Non-Goals:**
- No backend reconnect protocol changes.
- No room-state contract changes.
- No redesign of the healthy room layout.

## Decisions

### 1. Test reconnect through Fake EventSource injection

Use a test-controlled EventSource replacement that can trigger `onerror` deterministically.

Why:
- This is the most stable way to validate the reconnect-only branch without depending on browser-level SSE timing.

### 2. Recover through the existing catch-up path

After the forced realtime error, let polling recover the room through the existing catch-up API.

Why:
- This validates the real degradation and recovery path used by the app today.

### 3. Rewrite sync copy in player language

Replace terms such as `权威快照`, `序列`, `同步`, and `实时流` with room-progress language.

Why:
- The surface is for players, not for transport debugging.

## Risks / Trade-offs

- [Player-facing copy becomes less diagnostic] -> Acceptable because engineering detail still exists in lower-priority diagnostics surfaces.
- [Reconnect tests depend on a custom Fake EventSource] -> Acceptable because this is still more stable than trying to induce real browser SSE failure timing.

## Migration Plan

1. Add OpenSpec artifacts for reconnect regression and sync-shell language polish.
2. Rewrite reconnect-related sync shell copy.
3. Add a dedicated Playwright reconnect recovery regression.
4. Verify lint and e2e remain green.