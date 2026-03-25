## Why

The repository already contains both a Documentation Owner agent and a Release Marketer agent, but only the marketer is represented in the workflow gate. That mismatch causes two problems:

- `Monopoly Documentation Owner` can be skipped even though every round is expected to assess README and official docs impact.
- `Monopoly Release Marketer` feels missing in normal implementation rounds even though the role still exists and is intentionally release-scoped.

## What Changes

- Add `Monopoly Documentation Owner` to the enforced role-rotation workflow for substantial work.
- Keep `Monopoly Release Marketer` as a release-only required role and clarify that scope in workflow assets.
- Align hooks, tests, repository instructions, prompts, skill guidance, and contributor-facing README wording.

## Capabilities

### New Capabilities
- `workflow-documentation-governance`: every substantial round now requires an explicit documentation review decision before commit.

## Impact

- Affected code: workflow hooks, hook tests, prompts, instructions, skills, agents, README, OpenSpec artifacts.
- Runtime behavior: none for the game runtime.
- Team impact: documentation review becomes auditable each round, while release marketing remains correctly scoped to release/outreach work.