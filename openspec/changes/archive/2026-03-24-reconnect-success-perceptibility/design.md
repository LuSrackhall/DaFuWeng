## Context

Reconnect success feedback is functionally correct, but it still behaves like a lightweight toast that can be missed on mobile or swallowed by repeated recoveries.

The current state model also treats recovery success as a plain string, which is too weak for repeated display events.

## Goals / Non-Goals

**Goals:**
- Make reconnect success easier to notice without redesigning the room layout.
- Ensure repeated recoveries retrigger the success strip cleanly.
- Add regression coverage for mobile perceptibility and repeated recoveries.

**Non-Goals:**
- No backend reconnect changes.
- No protocol or room-state changes.
- No new reconnect panel system.

## Decisions

### 1. Recovery success becomes a tokenized frontend event

Represent reconnect success as a frontend event object with a token instead of a plain string.

Why:
- Repeated identical string updates are too weak for consecutive reconnect-success events.

### 2. Perceptibility improvements stay minimal and layout-safe

Use a stronger recovery status anchor, restartable animation, slightly longer dwell time, and better mobile emphasis.

Why:
- The goal is stronger visibility, not a room-shell redesign.

### 3. Regression coverage should target the highest-value risks

Automate:
- mobile reconnect success perceptibility
- repeated reconnect success refresh and timer reset

Why:
- These are the most likely places where the current strip can be missed or behave incorrectly.

## Risks / Trade-offs

- [Longer dwell time keeps the strip visible slightly longer] -> Acceptable because the strip remains lightweight and tied to recovery completion.
- [Sticky and animated styling could compete with nearby UI] -> Acceptable if kept subtle and verified against mobile action anchors.

## Migration Plan

1. Add OpenSpec artifacts for reconnect success perceptibility.
2. Tokenize reconnect success display state.
3. Apply minimal success-strip visibility improvements.
4. Add mobile and repeated-recovery regressions.
5. Verify lint and e2e remain green.