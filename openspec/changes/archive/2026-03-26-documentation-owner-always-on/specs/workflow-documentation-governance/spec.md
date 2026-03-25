# Purpose

Define auditable documentation-governance workflow behavior for every substantial round while preserving the release-only role of the release marketer.

# Requirements

## Requirement: Documentation Owner is required in substantial workflow modes

The repository SHALL require `Monopoly Documentation Owner` in substantial planning, implementation, and release workflow modes.

### Scenario: An implementation slice reaches commit readiness

- **WHEN** a substantial change reaches commit readiness
- **THEN** the workflow SHALL require a completed or waived `Monopoly Documentation Owner` review before commit

## Requirement: Release Marketer remains release-only

The repository SHALL keep `Monopoly Release Marketer` as a release and external-facing messaging role, not a routine implementation-round required role.

### Scenario: A normal implementation slice is committed

- **WHEN** an implementation slice is committed outside a release workflow
- **THEN** the workflow SHALL NOT require `Monopoly Release Marketer`

### Scenario: A release workflow runs

- **WHEN** release work reaches release readiness
- **THEN** the workflow SHALL require `Monopoly Release Marketer` before release actions proceed