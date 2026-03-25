## Why

CI already produces a structured release-evidence artifact on successful pushes to main, but the release workflow does not yet consume it.

That means semantic-release and the GitHub Release body still miss the completed slice, quality evidence, and remaining-risk context that CI already computed.

## What Changes

- Add a release-workflow script that downloads and consumes the triggering ci run's release-evidence artifact.
- Generate a release evidence summary appendix for the current release workspace.
- Append that summary to the local release summary file and GitHub Release body without changing semantic version calculation or the workflow_run trigger chain.

## Capabilities

### New Capabilities
- `release-automation`: the release workflow can consume ci-generated release-evidence artifacts and turn them into a stable engineering evidence appendix.

### Modified Capabilities
- `release-automation`: automatically published GitHub Releases can include a structured engineering evidence appendix derived from ci evidence.

## Impact

- Affected code: release workflow, release-evidence policy, semantic-release config, hook scripts, hook tests, and release automation docs.
- Release behavior: unchanged trigger topology and version inference; release notes gain additional engineering evidence context.
- Product behavior: no gameplay or backend changes.
