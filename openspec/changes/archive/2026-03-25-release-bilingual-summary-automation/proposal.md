## Why

The release workflow can already consume engineering evidence, but published release context still lacks a deterministic Chinese and English summary for engineering and player-facing communication.

That forces downstream release messaging to be assembled manually even though semantic-release notes and engineering evidence are already available in the pipeline.

## What Changes

- Add a deterministic bilingual summary generator based on semantic-release notes and engineering evidence.
- Append the bilingual summary to local release summary artifacts.
- Allow the GitHub Release body updater to append the bilingual summary alongside engineering evidence.

## Capabilities

### New Capabilities
- `release-automation`: the release pipeline can emit deterministic Chinese and English summary appendices from existing notes and engineering evidence.

### Modified Capabilities
- `release-automation`: published release context can include both engineering evidence and bilingual release summary appendices.

## Impact

- Affected code: release-evidence policy, semantic-release config, release body update logic, summary generation scripts, tests, docs, and release automation specs.
- Release behavior: unchanged trigger topology and version inference; release outputs gain bilingual summary context.
- Product behavior: no gameplay or backend changes.
