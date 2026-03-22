## Context

The current trade review card solved readability, but the final confirmation moment still lacks consequence-weighted guidance. The player can see the exchange, yet important risks are still too easy to miss.

This slice upgrades the confirmation step into a more decisive surface without adding protocol complexity or extending the flow.

## Goals / Non-Goals

**Goals:**
- Highlight traded-asset risk state directly on the confirmation surface.
- Show post-trade consequence hints, including room pause and control-change signals.
- Confirm that returning to edit preserves the current draft.
- Keep the implementation frontend-only.

**Non-Goals:**
- No backend or protocol changes.
- No fairness scoring, valuation, or recommendation engine.
- No new trade steps or counter-offer flow.

## Decisions

### 1. Keep the same review step, but raise its risk language

The trade flow keeps the same four-step sequence. Only the final step becomes more consequence-weighted.

Why:
- The flow itself is already understandable.
- The missing value is confidence at the confirmation moment, not another navigation step.

### 2. Show asset state inline with reviewed items

Reviewed properties and cards carry inline state details such as mortgage or building context when relevant.

Why:
- The player should not need to remember earlier asset details.
- Risk should stay attached to the exact item that carries it.

### 3. Make post-submit consequences explicit

The confirmation surface explains that sending the offer pauses the room and waits on the counterparty response, and highlights notable control or burden changes when detected.

Why:
- Players should understand both economic and operational consequences before sending.
- This reduces accidental submissions and uncertainty.

## Risks / Trade-offs

- [The confirmation surface carries more text] -> Acceptable because this is a deliberate high-risk review moment.
- [Some consequences may still need player interpretation] -> Acceptable because the goal is exposure, not automated strategy advice.
- [Additional consequence logic could grow brittle] -> Mitigated by limiting it to signals that can be derived directly from current frontend state.

## Migration Plan

1. Add OpenSpec deltas for the stronger trade risk confirmation surface.
2. Enrich the review card with asset state details and consequence hints.
3. Keep the propose-trade protocol unchanged.
4. Extend browser coverage with a back-edit-preserves-draft assertion.
5. Validate with lint and end-to-end coverage.