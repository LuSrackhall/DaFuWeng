## Context

Persistent agent policy and PR governance are now encoded and validated, but the repository still lacks a file-owned declaration of which ci checks should protect main, and it does not yet generate release evidence artifacts for successful main-branch validation runs.

This pass adds those two governance layers without changing the release workflow_run trigger chain.

## Goals / Non-Goals

**Goals:**
- Declare the expected required checks for protecting main in a repository policy file.
- Validate that the declared checks remain aligned with ci job names.
- Generate release evidence JSON and Markdown on successful pushes to main.
- Preserve the current release workflow trigger model.

**Non-Goals:**
- No automatic mutation of GitHub branch protection settings.
- No change to release workflow_run triggers or semantic-release behavior.
- No gameplay, frontend, or backend feature changes.
- No requirement that direct pushes already have associated PR bodies; the evidence generator may fall back when needed.

## Decisions

### 1. Use a branch protection contract policy

Store required PR checks and main-push-only checks in a repository-owned JSON policy.

Why:
- The expected protection posture becomes versioned, reviewable, and CI-verifiable.

### 2. Validate contract drift in ci

Add a dedicated branch-protection-contract job that checks the declared job names against the current ci workflow.

Why:
- Required-check names must not silently drift away from the repository's declared protection contract.

### 3. Generate release evidence only on push to main

Add a release-evidence job that runs only on push to main after the core ci checks succeed.

Why:
- The artifact belongs to the same successful ci run that release automation already trusts.

### 4. Use PR governance sections when available, but tolerate direct-push fallback

The release evidence generator will try to resolve an associated pull request body and extract the existing governance sections. If unavailable, it will fall back to commit-level evidence with warnings.

Why:
- This preserves current workflows while still starting to structure release evidence for future automation.

## Risks / Trade-offs

- [Branch protection contract does not enforce GitHub settings by itself] -> Acceptable because this slice explicitly focuses on repository-owned contracts and CI drift detection, not platform mutation.
- [Release evidence may sometimes use fallback data] -> Acceptable because direct pushes still exist today and should not immediately break the release chain.
- [CI job names become more governance-sensitive] -> Acceptable because that is the point of declaring a stable contract.

## Validation Strategy

1. Run hook unit tests, including branch protection and release evidence tests.
2. Run the branch protection contract validator directly.
3. Run the release evidence generator against a simulated push-to-main event.