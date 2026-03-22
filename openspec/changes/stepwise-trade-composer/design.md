## Context

The trade drafting surface already has the right raw ingredients: real counterparties, real asset pools, disabled reasons, and bilateral summaries. The remaining problem is sequencing. Right now players face every field at once.

This slice turns the draft into a progressive flow without changing the underlying trade model.

## Goals / Non-Goals

**Goals:**
- Break trade drafting into smaller sequential steps.
- Keep the bilateral summary visible across the whole flow.
- Prevent players from sending a trade without reviewing the final draft.
- Keep the implementation frontend-only.

**Non-Goals:**
- No backend or protocol changes.
- No counter-offer system.
- No fairness scoring, AI valuation, or negotiation chat.

## Decisions

### 1. Use four explicit steps

The composer will use four steps:

1. Select counterparty.
2. Choose what you offer.
3. Choose what you request.
4. Review and send.

Why:
- This matches the player's mental model better than a single long form.
- It keeps the early steps simpler and reduces first-glance density.

### 2. Keep the bilateral draft summary persistent

The trade summary stays visible on every step.

Why:
- Players should never lose track of what has already been selected.
- The summary becomes the anchor that ties the steps together.

### 3. Final submission only happens on the review step

The existing propose-trade command is still sent only once the player reaches the final review and confirms the offer.

Why:
- This preserves the existing authoritative protocol.
- It reduces accidental submissions from an in-progress draft.

## Risks / Trade-offs

- [One more click before sending an offer] -> Acceptable because the reward is a clearer and safer composition flow.
- [Some players may prefer editing everything at once] -> Acceptable because the current main problem is cognitive overload, not editing speed.
- [Trade drafting becomes slightly longer] -> Acceptable because it is an optional strategy tool, not the primary mandatory action.

## Migration Plan

1. Add OpenSpec deltas for a stepwise trade composer.
2. Refactor the draft form into sequential steps with persistent summary.
3. Keep the existing propose-trade request payload unchanged.
4. Add one Playwright scenario for the stepwise drafting flow.
5. Validate with lint and end-to-end coverage.