## Context

The reconnect success strip solves silent recovery, but it still leaves one question unanswered: what room state was actually recovered.

Current automated coverage also stops short of validating the mobile player reconnect experience, especially whether the success strip coexists cleanly with the current primary action and dismisses on time.

## Goals / Non-Goals

**Goals:**
- Add key room-state context to reconnect success feedback.
- Cover mobile player reconnect success flow.
- Assert success-strip timing so it appears, stays briefly, and then dismisses.

**Non-Goals:**
- No backend reconnect logic changes.
- No permission or rules changes.
- No redesign of the room-shell layout.

## Decisions

### 1. Success feedback should explain the recovered room context

The reconnect success strip should mention either the just-recovered event summary or the current acting player.

Why:
- Recovery should answer both “am I back?” and “where is the room now?”.

### 2. Mobile player reconnect gets its own regression

Use a narrow viewport player reconnect test that validates success feedback, current primary action visibility, and overflow behavior.

Why:
- Mobile player reconnect has different risk than desktop player reconnect or mobile spectator reconnect.

### 3. Success-strip timing becomes part of automation

The new mobile player reconnect test should verify the strip is visible long enough to notice and later disappears.

Why:
- This prevents the strip from becoming either too brief to help or too sticky to feel lightweight.

## Risks / Trade-offs

- [Timing assertions can be flaky if too strict] -> Acceptable if assertions use broad windows around the intended 2200ms lifetime.
- [Context text can become stale if derived from generic room state] -> Acceptable because it still improves situational awareness compared with a context-free success message.

## Migration Plan

1. Add OpenSpec artifacts for reconnect context and mobile player timing.
2. Extend reconnect success feedback with recovered room context.
3. Add a mobile player reconnect Playwright regression with timing assertions.
4. Verify lint and e2e remain green.