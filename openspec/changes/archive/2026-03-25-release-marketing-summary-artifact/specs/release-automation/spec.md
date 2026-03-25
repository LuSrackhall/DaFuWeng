# Purpose

Extend release automation so the pipeline emits a standalone marketing-summary artifact for outward-facing release communication.

# Requirements

## Requirement: Release automation generates standalone marketing summaries

The system SHALL generate a standalone marketing-summary artifact from semantic-release notes and engineering evidence without relying on external models.

### Scenario: Marketing artifact is prepared

- **WHEN** the release workflow prepares release artifacts
- **THEN** it SHALL generate a separate marketing-summary file suitable for outward-facing reuse

## Requirement: Release workflow uploads marketing-summary artifacts separately

The system SHALL upload the marketing-summary artifact separately from the broader release-summary artifact.

### Scenario: Release artifacts are published

- **WHEN** the release workflow uploads summary outputs
- **THEN** it SHALL publish a dedicated marketing-summary artifact without altering semantic version inference or the workflow_run trigger chain
