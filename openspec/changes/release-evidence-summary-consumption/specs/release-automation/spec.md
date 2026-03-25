# Purpose

Extend release automation so the release workflow consumes ci-generated release-evidence artifacts and publishes an engineering evidence appendix.

# Requirements

## Requirement: The release workflow consumes ci release-evidence artifacts

The system SHALL download and consume the triggering ci run's release-evidence artifact during release automation.

### Scenario: Release workflow starts after ci success

- **WHEN** the release workflow runs after a successful ci workflow_run on main
- **THEN** it SHALL attempt to download the triggering ci run's release-evidence artifact and prepare an engineering evidence summary appendix for the release workspace

## Requirement: Published releases include engineering evidence context

The system SHALL append the engineering evidence summary appendix to the generated release summary and the published GitHub Release body when available.

### Scenario: Release publication succeeds

- **WHEN** semantic-release publishes a versioned GitHub Release
- **THEN** the release process SHALL add the engineering evidence appendix to the local release summary and to the published GitHub Release body without altering semantic version inference
