## Context

The reconnect path already communicates failure and recovery mechanics, but once recovery finishes the UI currently returns to normal too quietly.

Spectator reconnect is also covered only on desktop, leaving mobile spectator recovery as an uncovered high-risk surface.

## Goals / Non-Goals

**Goals:**
- Provide a lightweight but explicit reconnect-success confirmation.
- Validate spectator reconnect on mobile.
- Continue removing mechanical waiting wording from high-visibility UI.

**Non-Goals:**
- No backend reconnect mechanism changes.
- No new room actions or permission changes.
- No redesign of the room-shell layout.

## Decisions

### 1. Reconnect success uses a short-lived status strip

After reconnect recovery completes, show a short-lived success strip near the top of the room page.

Why:
- It confirms recovery without blocking the board or hijacking the main action surface.

### 2. Recovery success should only appear after real catch-up succeeds

Do not show success when the connection merely resumes; show it only after room state has actually caught up.

Why:
- This avoids false reassurance.

### 3. Mobile spectator reconnect gets a dedicated regression

Use a narrow viewport and a spectator-only reconnect flow to verify the reconnect success strip, latest-state recovery, and read-only guarantees.

Why:
- Mobile spectator recovery is a distinct risk surface with different hierarchy constraints.

## Risks / Trade-offs

- [Short-lived success feedback may disappear before a slow reader fully notices it] -> Acceptable because it supplements rather than replaces the recovered room state.
- [More user-facing copy updates may require test alignment] -> Acceptable because the goal is to standardize the product voice.

## Migration Plan

1. Add OpenSpec artifacts for reconnect success feedback and mobile spectator recovery.
2. Extend the projection hook to emit reconnect-success state.
3. Render a lightweight reconnect-success strip in the room page.
4. Add a mobile spectator reconnect recovery regression.
5. Verify lint and e2e remain green.