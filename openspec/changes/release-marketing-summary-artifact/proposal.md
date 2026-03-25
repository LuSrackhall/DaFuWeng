## Why

The release pipeline already emits engineering summaries and deterministic bilingual summaries, but outward-facing announcement material still has to be manually extracted from those artifacts.

A standalone marketing-summary artifact would let the team reuse a conservative, release-scoped announcement file across README updates, doc-site updates, and release communication without reinterpreting raw release notes every time.

## What Changes

- Add a standalone marketing-summary generator based on semantic-release notes and engineering evidence.
- Upload the generated marketing summary as a separate release artifact.
- Keep the generation deterministic and conservative without changing release triggers or semantic version inference.

## Capabilities

### New Capabilities
- `release-automation`: the release workflow can emit a standalone marketing-summary artifact for outward-facing reuse.

### Modified Capabilities
- `release-automation`: release outputs now include engineering summary, bilingual summary, and marketing-summary artifacts.

## Impact

- Affected code: release-evidence policy, semantic-release prepare flow, release workflow artifacts, summary generation scripts, tests, docs, and release automation specs.
- Release behavior: unchanged trigger topology and version inference; release outputs gain an extra announcement-oriented artifact.
- Product behavior: no gameplay or backend changes.
