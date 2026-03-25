# Release Automation

## Strategy

- Conventional commits drive semantic versioning.
- GitHub Actions is the only supported release authority.
- `semantic-release` generates versions, changelog entries, tags, and GitHub Releases.
- `Monopoly Versioning Manager` is the review role for semantic version impact, changelog facts, and release-governance handoff before commit or release steps.

## Required Secrets

- `GITHUB_TOKEN`: provided by GitHub Actions for release publication.

## Branch Expectations

- `main` is the release branch.
- validation workflows run on pushes and pull requests.
- release workflow runs after validation succeeds on `main`.

## Release Outputs

- updated `CHANGELOG.md`
- generated GitHub Release notes
- release summary artifact for marketing and post-release communication
- engineering evidence appendix derived from CI release-evidence artifact content
- deterministic Chinese and English release summary appendix derived from release notes and engineering evidence
- standalone marketing-summary artifact for outward-facing announcement reuse

## Role Handoff

- `Monopoly QA Lead` provides the quality gate, including an explicit verdict on whether unit, integration, and Playwright coverage are current enough for the slice.
- `Monopoly Full-Stack Performance Expert` provides a performance and memory-risk gate for slices that can affect runtime cost, recovery latency, or long-session stability.
- `Monopoly Simulated Player` provides the player-experience gate after objective quality evidence is in place.
- `Monopoly Versioning Manager` converts validated scope into semantic version and changelog facts.
- `Monopoly Release Marketer` consumes those facts to produce Chinese and English release messaging.
