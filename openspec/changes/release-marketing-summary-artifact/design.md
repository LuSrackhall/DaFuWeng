## Context

The repository can already generate release notes, engineering evidence, and deterministic bilingual summaries, but it still lacks a separate outward-facing artifact tailored for announcement reuse.

This pass adds a standalone marketing-summary file while preserving the current workflow_run release topology and semantic-release versioning authority.

## Goals / Non-Goals

**Goals:**
- Generate a standalone marketing-summary artifact from current release notes and engineering evidence.
- Keep the wording deterministic, conservative, and suitable for README or doc-site reuse.
- Upload the artifact separately from engineering summary artifacts.
- Preserve trigger topology and version inference.

**Non-Goals:**
- No external model or translation service usage.
- No freeform promotional rewriting beyond fixed templates.
- No change to GitHub Release trigger wiring.
- No change to semantic-release version bump logic.

## Decisions

### 1. Keep marketing-summary separate from engineering summaries

The new artifact will be generated as its own markdown file instead of being merged into release-notes.md.

Why:
- External announcement material has a different audience and should remain independently reusable.

### 2. Use a two-column bilingual layout

The marketing-summary will present Chinese and English side by side in a deterministic markdown table.

Why:
- This gives the Release Marketer a reusable artifact without forcing them to reconstruct bilingual parity manually.

### 3. Reuse existing deterministic summary inputs

The generator will rely only on semantic-release notes and engineering evidence already available in the release workspace.

Why:
- This preserves traceability and avoids introducing a second facts pipeline.

### 4. Upload as a dedicated artifact

The release workflow will upload the marketing-summary separately from the broader release-summary artifact.

Why:
- Consumers like README or doc-site maintainers can fetch the outward-facing artifact directly.

## Risks / Trade-offs

- [Marketing language may remain intentionally plain] -> Acceptable because conservative phrasing is safer than speculative promotional language.
- [Markdown tables may not render identically everywhere] -> Acceptable because the artifact is primarily for reuse and editing, not pixel-perfect presentation.
- [Some changes may stay in original wording] -> Acceptable because fidelity to shipped facts is more important than freeform rewriting.

## Validation Strategy

1. Run hook unit tests, including marketing summary tests.
2. Run the marketing summary generator against sample notes and evidence.
3. Verify the release workflow is configured to upload the marketing-summary artifact.
