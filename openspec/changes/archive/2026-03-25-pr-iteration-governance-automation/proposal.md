## Why

The repository now enforces persistent agent iteration policy in CI and local hooks, but pull requests still rely on freeform descriptions.

That makes completed slices, quality evidence, remaining risks, and next-step guidance inconsistent across reviews.

## What Changes

- Add a repository-level PR template for iteration governance.
- Add a PR governance policy file and PR body validator.
- Add a dedicated CI job that validates PR body structure on pull requests.
- Document the PR governance expectation in testing and release guidance.

## Capabilities

### New Capabilities
- `release-automation`: CI can validate required PR governance sections for pull requests.

### Modified Capabilities
- `release-automation`: PR authors now get a stable repository template for reporting the completed slice, quality evidence, remaining risks, and next steps.

## Impact

- Affected code: GitHub Actions, hook scripts, hook tests, PR template, and release/testing instructions.
- Release behavior: unchanged trigger chain; only PR quality evidence requirements expand.
- Product behavior: no gameplay or backend changes.