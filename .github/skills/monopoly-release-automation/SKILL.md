---
name: monopoly-release-automation
description: 'Set up or evolve CI CD, semantic release automation, changelog generation, GitHub Releases, artifact publishing, and release-note or marketing workflows for the Monopoly project.'
argument-hint: 'Describe the release pipeline, workflow, or automation change needed'
user-invocable: true
---

# Monopoly Release Automation

Use this skill when working on automated versioning, release orchestration, or distribution pipelines.

## When To Use

- GitHub Actions needs to build, test, package, or release the project.
- Version bumps, tags, changelogs, or GitHub Releases should be fully automated.
- Release notes and marketing copy should be derived from commit history and release scope.

## Procedure

1. Confirm the release source of truth.
   - Conventional commits are the input.
   - CI is the system that computes versions and creates tags.
2. Separate workflow stages.
   - Validation jobs: lint, unit, integration, end-to-end.
   - Packaging jobs: web artifacts, Tauri bundles, backend binaries if needed.
   - Release jobs: version calculation, changelog, GitHub Release publication.
3. Preserve repo-wide consistency.
   - Do not add manual version files unless the toolchain requires them.
   - Prefer one automated release authority instead of multiple competing workflows.
4. Keep release notes dual-use.
   - Engineering summary for changelog consumers.
   - Player-facing summary for update announcements.
5. Involve the right roles.
   - Use `Monopoly Tech Lead` for architecture and CI shape.
   - Use `Monopoly QA Lead` for release gates.
   - Use `Monopoly Release Marketer` for Chinese and English launch copy.

## Output

- Proposed workflow topology
- Release automation decisions
- Required secrets or repository settings
- Release-note and marketing deliverables