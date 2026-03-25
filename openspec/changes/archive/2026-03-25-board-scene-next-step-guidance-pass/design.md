## Context

Previous passes taught the board how to explain active pressure, closure, and resume context, but some of the most important follow-through is still implicit.

This pass focuses on the next authoritative action after a closure and on making selected economic chains feel properly closed inside the board scene.

## Goals / Non-Goals

**Goals:**
- Explain the next authoritative action after jail release, player-creditor deficit recovery, and supported economic-chain closures.
- Keep one dominant closure cue without creating a new gameplay phase.
- Make player-to-player debt closure more explicit.
- Keep all additions semantic-first and read-only.

**Non-Goals:**
- No backend or contract changes.
- No new gameplay phases or client-side state machines.
- No migration of interactive controls into BoardScene.
- No attempt to model every possible economic chain in one pass.

## Decisions

### 1. Extend the existing BoardPhaseClosureCue instead of creating a parallel cue family

GamePage will extend the current closure cue with explicit next-step guidance.

Why:
- Closure and next-step guidance are part of the same user question: what just closed, and what happens now.

### 2. Support jail release as a closure outcome

BoardScene will explain when a jail decision has ended and which authoritative step resumed next.

Why:
- Jail is a high-friction stage where players often lose track of whether they have really exited the decision loop.

### 3. Differentiate player-creditor recovery from generic bank recovery

When a deficit is resolved against another player, the closure cue will explicitly name the payee and the debt closure.

Why:
- Player-to-player debt has stronger social and tactical weight than bank-only payments.

### 4. Recognize supported complex economic chain closure

BoardScene will narrate supported final-chain outcomes such as bankruptcy settlement without pretending to replay every sub-step.

Why:
- Players need to know the chain has truly closed, not just that one intermediate event fired.

## Risks / Trade-offs

- [Closure cards could become too verbose] -> Acceptable because the pass keeps one dominant cue and separates detail from next-step guidance.
- [Not every economic chain is covered] -> Acceptable because this pass intentionally focuses on the most confusing and user-visible closures.
- [Jail release and economic chain closure could overlap with ordinary result cards] -> Acceptable because closure remains the bridge from result to next authoritative action.

## Validation Strategy

1. Run frontend lint.
2. Re-run the clean Playwright suite.
3. Guard jail release, player-creditor deficit closure, and supported economic-chain closure summaries through e2e semantic assertions.