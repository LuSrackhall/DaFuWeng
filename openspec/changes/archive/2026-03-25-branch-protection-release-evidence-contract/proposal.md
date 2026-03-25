## Why

The repository now validates agent policy and PR governance, but two release-governance gaps remain.

First, the expected required checks for protecting main are not declared in a repository-owned contract. Second, successful main-branch CI runs do not yet emit a structured release evidence artifact that later release automation can consume.

## What Changes

- Add a versioned branch protection contract policy and validator.
- Add a versioned release evidence policy and generator.
- Add CI jobs for branch protection contract validation and release evidence generation.
- Upload structured release evidence artifacts on successful pushes to main.

## Capabilities

### New Capabilities
- `release-automation`: CI can validate the declared branch protection contract against stable ci job names.
- `release-automation`: CI can emit a structured release evidence artifact for successful pushes to main.

## Impact

- Affected code: GitHub Actions, governance policies, hook scripts, hook tests, and release/testing instructions.
- Release behavior: unchanged trigger chain; ci now produces additional release evidence artifacts.
- Product behavior: no gameplay or backend changes.