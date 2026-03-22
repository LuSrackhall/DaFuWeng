## Context

The trade composer already uses four steps, but the final review still behaves more like a placeholder than a committed verification surface. The player can submit from that step, yet the card does not summarize the exchange strongly enough.

This slice improves the confirmation moment without changing the underlying protocol or step structure.

## Goals / Non-Goals

**Goals:**
- Turn the final step into a true review card.
- Show grouped exchange details and net cash flow clearly.
- Prevent empty drafts from entering the review step.
- Keep the implementation frontend-only.

**Non-Goals:**
- No backend or protocol changes.
- No fairness scoring or AI valuation.
- No counter-offer or chat flow.

## Decisions

### 1. Strengthen the final step instead of adding more steps

The composer keeps its current four-step structure. Only the review step becomes more explicit and more readable.

Why:
- The step structure is already understandable.
- The remaining problem is the quality of the final confirmation surface, not the overall flow length.

### 2. Block empty drafts before review

The player cannot advance from the request-selection step into review if the overall draft is still empty.

Why:
- Empty drafts have no confirmation value.
- This prevents a pointless final step and surfaces the issue sooner.

### 3. Review card focuses on result language

The card explains the final exchange in grouped form and highlights net cash flow plus edit safety.

Why:
- Players need one last trustworthy read before they commit.
- Review should reduce hesitation, not create one more parsing task.

## Risks / Trade-offs

- [More copy on the final step] -> Acceptable because this is a high-risk confirmation surface.
- [Players may still want value guidance] -> Out of scope; the goal is clarity, not strategy advice.
- [One more disabled state to explain] -> Acceptable because preventing empty review is clearer than allowing a dead-end final step.

## Migration Plan

1. Add OpenSpec deltas for the strengthened trade review card.
2. Upgrade the review step content and early empty-draft blocking.
3. Keep propose-trade payload and pending trade protocol unchanged.
4. Add one Playwright scenario for the review card and empty-draft gate.
5. Validate with lint and end-to-end coverage.