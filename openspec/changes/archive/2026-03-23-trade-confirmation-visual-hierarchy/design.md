## Context

The trade confirmation surface already exposes risk and consequence data, but the page still reads too much like a uniform information card. The player should be guided through one clear order: first understand what will happen, then inspect the exchange details, then decide whether to edit or commit.

This slice improves the reading order and visual emphasis without adding more trade logic.

## Goals / Non-Goals

**Goals:**
- Separate main decision information from secondary explanation.
- Put irreversible consequences above general risk notes.
- Move exchange detail review below consequence-first guidance.
- Keep the implementation frontend-only.

**Non-Goals:**
- No backend or protocol changes.
- No new warning semantics beyond what current frontend state already derives.
- No new trade steps or modals.

## Decisions

### 1. Use consequence-first reading order

The final confirmation surface first shows the action framing and what happens next, then the secondary risk notes, then the detailed exchange breakdown.

Why:
- Players should decide whether to stop before they parse the full asset list.
- This matches the final-decision mental model better than a flat summary card.

### 2. Make irreversible consequences the highest visual tier

The room-pause and final-send consequence becomes the strongest visible warning block on the confirmation surface.

Why:
- This is the most time-sensitive information at the moment of commitment.
- It reduces accidental submissions by making the outcome explicit.

### 3. Keep bilateral details readable but secondary

The “you give / you receive” detail stays visible, but it sits behind the consequence-first layer.

Why:
- Players still need to verify exchange details.
- Those details should support the decision, not compete with the consequence framing.

## Risks / Trade-offs

- [More structural chrome on the confirmation step] -> Acceptable because this is a decision surface, not a passive summary.
- [Some players may prefer the old flatter layout] -> Acceptable because the goal is decision safety, not compactness.
- [Stronger hierarchy may require maintenance if text grows] -> Mitigated by keeping sections explicit and minimal.

## Migration Plan

1. Add OpenSpec deltas for the stronger confirmation hierarchy.
2. Reorder the final review structure and style its priority tiers.
3. Keep trade protocol and data derivation unchanged.
4. Add one Playwright assertion set for the new section hierarchy.
5. Validate with lint and end-to-end coverage.
