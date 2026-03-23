## Context

The room page already prioritizes the current stage on mobile, and pending trade has dedicated mobile coverage. Accepted and rejected trade result cards were added later and currently rely on general grid behavior plus desktop-oriented structure.

This slice adds explicit mobile pressure handling for those result moments without changing behavior or protocol.

## Goals / Non-Goals

**Goals:**
- Keep accepted and rejected trade result cards readable at 375px width.
- Remove any risk of two-column result compression on narrow screens.
- Preserve the visibility of the next-step label and prevent horizontal overflow.
- Add mobile browser evidence for both accepted and rejected result cards.

**Non-Goals:**
- No protocol or projection changes.
- No new result-card interaction patterns.
- No broader mobile redesign outside trade results.

## Decisions

### 1. Force trade result cards into a single-column reading flow on mobile

Accepted and rejected result cards keep their desktop structure but collapse into a single-column layout on narrow screens.

Why:
- Result confirmation matters more than side-by-side comparison on phones.
- This is the smallest fix that protects readability.

### 2. Prefer wrapping over truncation

Long player names and dense result lines wrap naturally instead of clipping or requiring horizontal scroll.

Why:
- Truncation would hide critical trade facts.
- Horizontal scrolling is a poor fit for result confirmation moments.

### 3. Validate with dedicated mocked mobile result scenarios

The mobile evidence comes from mocked accepted and rejected snapshots with dense result content.

Why:
- This keeps tests deterministic.
- The result-card layout can be stressed directly without relying on a long live setup flow.

## Risks / Trade-offs

- [Mobile result cards become longer vertically] -> Acceptable because vertical reading is preferable to compressed two-column comparison on phones.
- [Additional Playwright mocks increase test volume slightly] -> Acceptable because the risk is squarely in mobile rendering and needs direct evidence.

## Migration Plan

1. Add OpenSpec deltas for mobile trade-result stress coverage.
2. Add mobile result-card CSS constraints.
3. Add accepted and rejected mobile result-card Playwright tests.
4. Validate with lint and Playwright.