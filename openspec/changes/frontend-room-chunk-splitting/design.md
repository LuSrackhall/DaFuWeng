## Context

The production frontend build still produces a single oversized entry chunk even after gameplay presentation work has been split into cleaner UI slices.

The largest pressure comes from shipping room-scene code and heavy vendor dependencies too early.

## Goals / Non-Goals

**Goals:**
- Remove the oversized frontend entry-chunk warning.
- Keep the lobby path lighter than the room scene path.
- Avoid blank-route flashes when lazy chunks load.

**Non-Goals:**
- No user-facing gameplay redesign.
- No server-side or deployment-platform changes.
- No deep application architecture rewrite.

## Decisions

### 1. Lazy load room and lobby route modules

Use router-level lazy loading so page-level code is fetched only when needed.

Why:
- This is the lowest-risk cut with the highest bundle reduction leverage.

### 2. Manually separate heavy vendor groups

Split Pixi and React-family dependencies into explicit build chunks.

Why:
- This reduces the chance that page code and runtime dependencies collapse back into one oversized output.

### 3. Provide a router fallback element

Show a lightweight loading shell while lazy route chunks load.

Why:
- This avoids a perceived blank page when entering the room route cold.

## Risks / Trade-offs

- [Initial navigation to the room route adds an extra network step] -> Acceptable because the room route is heavier and benefits most from delayed loading.
- [Manual chunk policy can become stale as dependencies change] -> Acceptable because the current grouping is intentionally small and easy to revisit.

## Migration Plan

1. Add OpenSpec artifacts for frontend route chunk splitting.
2. Convert route modules to lazy route loading.
3. Add a router fallback element.
4. Configure manual vendor chunk grouping in Vite.
5. Verify build output and room-route smoke coverage.