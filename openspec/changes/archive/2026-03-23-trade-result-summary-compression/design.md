## Context

Trade result cards already cover acceptance, rejection, mobile layout, and browser recovery. The remaining issue is that they still read like expanded data dumps when a trade is simple or sparse.

This slice improves scan speed by removing empty categories and front-loading a compact summary for each side.

## Goals / Non-Goals

**Goals:**
- Remove empty trade result categories from accepted and rejected summaries.
- Surface a concise summary for each side before the detailed lines.
- Preserve replay-safe and refresh-safe trade result reconstruction.

**Non-Goals:**
- No protocol or backend changes.
- No new collapsible interaction.
- No changes to trade rules or settlement math.

## Decisions

### 1. Compress at the projection layer

Accepted and rejected trade result summaries should be normalized before they reach the component.

Why:
- This keeps UI rendering simple.
- The same compressed summary remains consistent across desktop, mobile, refresh, and replay recovery.

### 2. Keep details, but demote them visually

The detailed lines remain visible, but the result card leads with a concise per-side summary.

Why:
- Players still need the details for confirmation.
- The summary should carry the primary reading load.

## Risks / Trade-offs

- [Some players may prefer exhaustive lists first] -> Acceptable because the details remain visible immediately below the summary.
- [Projection shape grows slightly] -> Acceptable because the added summary strings are local, small, and remove repeated UI logic.

## Migration Plan

1. Add OpenSpec deltas for trade result summary compression.
2. Compress empty categories and generate per-side summaries in projection.
3. Update result-card rendering to show summaries first.
4. Validate with lint, projection tests, and Playwright.