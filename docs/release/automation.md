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

## Role Handoff

- `Monopoly QA Lead` and `Monopoly Simulated Player` provide quality and experience gates.
- `Monopoly Versioning Manager` converts validated scope into semantic version and changelog facts.
- `Monopoly Release Marketer` consumes those facts to produce Chinese and English release messaging.
