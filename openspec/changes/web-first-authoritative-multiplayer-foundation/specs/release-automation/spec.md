## ADDED Requirements

### Requirement: CI validates foundational project quality
The system SHALL run automated validation in GitHub Actions for source quality, tests, and buildable project structure before release jobs are eligible to run.

#### Scenario: Change is pushed to the main integration branch
- **WHEN** code is pushed or merged into the primary integration branch
- **THEN** GitHub Actions SHALL run the configured validation workflow for the foundational project structure

#### Scenario: Validation fails
- **WHEN** one or more required validation jobs fail
- **THEN** release jobs SHALL NOT publish a versioned release from that revision

### Requirement: Versions and changelogs are derived from conventional commits
The system SHALL compute semantic version changes, changelog content, and release metadata from conventional commit history in CI.

#### Scenario: Release-worthy commits reach the release branch
- **WHEN** CI evaluates conventional commits that require a new release
- **THEN** the release workflow SHALL determine the next semantic version and generate release notes or changelog content automatically

#### Scenario: No release-worthy commits are present
- **WHEN** the release workflow finds no qualifying semantic version change
- **THEN** it SHALL skip publishing a new release

### Requirement: Releases are published without manual version editing
The system MUST publish tags, GitHub Releases, and associated notes through automation rather than by manually editing version numbers or manually creating releases.

#### Scenario: Automated release publishes a version
- **WHEN** the release workflow completes successfully for a release-worthy revision
- **THEN** it SHALL create the release metadata, tag, and GitHub Release artifacts through automation

#### Scenario: Release notes need player-facing messaging
- **WHEN** automated release notes are produced
- **THEN** the release process SHALL support combining engineering change summaries with player-facing update copy in the generated release output