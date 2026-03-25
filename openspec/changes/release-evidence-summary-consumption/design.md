## Context

The repository now generates release-evidence artifacts in ci for successful pushes to main, but the downstream release workflow still ignores them.

This pass wires those artifacts into the release pipeline without changing the current workflow_run trigger or semantic-release versioning authority.

## Goals / Non-Goals

**Goals:**
- Download the triggering ci run's release-evidence artifact during the release workflow.
- Generate a stable engineering evidence appendix from the artifact.
- Append that appendix to the local release summary file and the published GitHub Release body.
- Keep semantic-release in charge of version inference and release publication.

**Non-Goals:**
- No change to release workflow triggers.
- No change to semantic version bump logic.
- No change to ci evidence generation behavior beyond the policy fields already defined.
- No attempt to fail release publication purely because release evidence is unavailable.

## Decisions

### 1. Consume artifacts by workflow_run id

The release workflow will resolve the triggering ci run id from the workflow_run payload and download its release-evidence artifact via the GitHub Actions artifact API.

Why:
- This preserves the current release topology and avoids introducing new dispatch or storage layers.

### 2. Generate a soft-fail engineering evidence appendix

If the artifact is unavailable or malformed, the consumer will still emit a summary appendix with a fallback explanation instead of failing the whole release.

Why:
- Release evidence is supplementary context, not the authority for whether a version should publish.

### 3. Append evidence in two places

The engineering evidence appendix will be appended to:
- the local `release-notes.md` summary file via semantic-release prepare
- the GitHub Release body via a post-publish update step

Why:
- This gives both local release summary artifacts and the published GitHub Release the same engineering context.

### 4. Keep versioning untouched

Version inference remains driven by conventional commits and semantic-release plugins already in place.

Why:
- Release evidence should enrich release context, not alter semantic version decisions.

## Risks / Trade-offs

- [The triggering ci artifact may be missing or expire] -> Acceptable because the summary consumer falls back without blocking publication.
- [GitHub Release body patching may fail transiently] -> Acceptable because the post-publish step is soft-fail and leaves the normal release intact.
- [Summary content could drift from policy fields] -> Acceptable because the same release-evidence policy still defines the source artifact contract.

## Validation Strategy

1. Run hook unit tests, including artifact-consumption and GitHub body update tests.
2. Run the artifact consumer against a simulated workflow_run payload.
3. Verify the local release summary file can include the engineering evidence appendix when the summary file is present.
