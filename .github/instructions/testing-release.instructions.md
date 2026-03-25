---
description: "Use when writing tests, Playwright coverage, GitHub Actions workflows, semantic version automation, changelog generation, release notes, or distribution pipelines for this project."
name: "Testing And Release Instruction"
---

# Testing And Release Guidelines

- CI is the primary build and release environment. Local build commands are for diagnosis, not the default release path.
- Use conventional commits so release automation can infer semantic version bumps.
- Prefer semantic-release style automation for version calculation, changelog generation, Git tags, and GitHub Releases.
- Keep release notes dual-purpose: precise engineering summary and player-facing highlights.

## Test Strategy

- Unit tests should cover deterministic game rules exhaustively.
- Integration tests should cover backend command validation, PocketBase collection interactions, and reconnect flows.
- Playwright should cover the user-critical happy paths plus at least one recovery path for disconnect or refresh.
- A feature is not ready for release if its primary loop cannot be exercised in automated tests.

## Workflow Expectations

- Keep GitHub Actions jobs composable: lint, unit test, integration test, end-to-end test, package, release.
- Release workflows should publish artifacts and notes without manual version edits.
- Marketing copy and changelog text should be generated from the release context, not written by hand each time.
- Pull requests for substantial work should summarize the completed slice, quality evidence, remaining risks, and next-step recommendations in a stable template that CI can validate.
- The repository should declare stable required status checks for main branch protection in versioned policy, and CI should generate release evidence artifacts on successful pushes to main without changing the release trigger chain.
- The release workflow should consume CI release-evidence artifacts as soft engineering context, append them to release summaries, and keep semantic version inference unchanged.
- Bilingual publish summaries should be generated deterministically from semantic-release notes and engineering evidence only, with conservative wording and no external model dependency.
- External-facing marketing summary artifacts should remain deterministic, conservative, and separately uploadable from engineering summary artifacts.
