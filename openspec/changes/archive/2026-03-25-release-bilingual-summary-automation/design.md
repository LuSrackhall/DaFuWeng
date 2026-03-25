## Context

The repository now publishes semantic-release notes and appends engineering evidence, but it still lacks a deterministic bilingual summary layer for Chinese and English release communication.

This pass generates that bilingual appendix from existing release facts only, without introducing external model calls or changing the current workflow_run release topology.

## Goals / Non-Goals

**Goals:**
- Generate a deterministic Chinese and English summary appendix from semantic-release notes and engineering evidence.
- Append that bilingual summary to local release summary artifacts.
- Allow the GitHub body update step to append the bilingual summary when present.
- Keep version inference and release trigger topology unchanged.

**Non-Goals:**
- No external translation service or model usage.
- No change to semantic-release version bump logic.
- No change to release workflow trigger wiring.
- No freeform rewriting of release entries beyond conservative templated summaries.

## Decisions

### 1. Use fixed bilingual templates with source-preserving details

The generator will use fixed Chinese and English headings and boilerplate lines, while preserving detailed change bullets from the original release notes.

Why:
- This keeps wording stable and avoids hallucinated translations.

### 2. Classify release notes conservatively

The generator will recognize a small fixed set of release-note headings such as Features and Bug Fixes, and group the rest under neutral additional-notes sections.

Why:
- A small taxonomy is more reliable than open-ended interpretation.

### 3. Reuse engineering evidence directly

The generator will reuse completed slice, quality evidence, and remaining risks from existing engineering evidence JSON when available.

Why:
- Engineering evidence is already the repository's structured source of truth for validation context.

### 4. Append bilingual context as soft supplementary output

If bilingual summary generation fails or inputs are unavailable, release publication should still continue with its existing semantic-release flow.

Why:
- Bilingual summary improves communication but should not become a hard release gate.

## Risks / Trade-offs

- [Detailed bullets may remain in their original wording] -> Acceptable because deterministic summaries should prefer fidelity over speculative translation.
- [Unrecognized release-note headings collapse into additional notes] -> Acceptable because neutral grouping is safer than guessing intent.
- [Summary appendices make release bodies longer] -> Acceptable because the content is still structured, supplementary, and bounded.

## Validation Strategy

1. Run hook unit tests, including bilingual summary and body append tests.
2. Run the bilingual summary generator against sample notes and evidence inputs.
3. Verify the publish updater can append both engineering evidence and bilingual summary sections without duplication.
