# Purpose

Define workflow rules that make test-layer judgment and performance review auditable parts of substantial rounds.

# Requirements

## Requirement: QA explicitly judges testing-layer drift

The repository SHALL require QA workflow outputs to state whether unit, integration, and Playwright coverage are current or lagging for a substantial slice.

### Scenario: A substantial slice changes gameplay logic

- **WHEN** a substantial slice changes deterministic logic, backend boundaries, or player journeys
- **THEN** the workflow SHALL record whether unit, integration, and Playwright coverage are current or lagging, and whether any failing checks indicate stale tests or business-logic regressions

## Requirement: Performance review is a fixed workflow checkpoint

The repository SHALL require a full-stack performance review role for substantial planning, implementation, and release workflow modes.

### Scenario: A substantial slice reaches commit readiness

- **WHEN** a substantial slice reaches commit readiness
- **THEN** the workflow SHALL require a completed or waived `Monopoly Full-Stack Performance Expert` review before commit

## Requirement: Playwright is not the default deterministic regression layer

The repository SHALL treat Playwright as player-journey evidence instead of the primary regression layer for deterministic rules.

### Scenario: A slice changes deterministic rule behavior

- **WHEN** a slice changes deterministic rules or projection logic
- **THEN** the workflow SHALL prefer unit and integration coverage as the primary regression proof, with Playwright reserved for key player journeys and recovery evidence