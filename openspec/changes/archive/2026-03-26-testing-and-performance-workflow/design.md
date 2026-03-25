## Context

The repository already expects unit, integration, and Playwright coverage, but workflow assets do not yet force a round-by-round decision about which test layers are current or lagging. In practice, this makes slow E2E checks carry too much weight. The repository also lacks a dedicated full-stack performance role, leaving performance and memory review to ad hoc judgment.

## Goals / Non-Goals

**Goals:**
- Make unit and integration tests the explicit fast regression defaults for deterministic rules and backend boundaries.
- Require QA to declare whether unit, integration, and E2E coverage are current or lagging every substantial round.
- Add a fixed `Monopoly Full-Stack Performance Expert` workflow role.
- Keep enforcement centralized in hooks and backed by hook tests.
- Update contributor-facing workflow documentation to match the new rules.

**Non-Goals:**
- No new CI jobs or performance tooling in this slice.
- No separate unit-test-only or E2E-only agent roles.
- No gameplay feature implementation.

## Decisions

### 1. QA remains the single owner of testing-layer judgment

The repository does not add separate unit-test and E2E specialist roles. `Monopoly QA Lead` remains the single testing owner and must explicitly judge whether failures imply stale tests, stale specs, or business-logic regressions.

### 2. Performance review becomes a first-class workflow role

`Monopoly Full-Stack Performance Expert` is added to planning, implementation, and release workflow modes. The role may be waived when clearly out of scope, but it cannot be skipped silently.

### 3. Playwright is a proof layer, not the default regression layer

Playwright remains necessary for key player journeys and recovery paths. It should not substitute for unit and integration coverage of deterministic game rules, state transitions, and backend boundaries.

### 4. README and release automation docs reflect stable workflow facts

README should expose the new contributor-facing workflow facts. Official docs should record the updated release handoff expectations where quality and performance evidence flow into release readiness.

## Validation Strategy

1. Update hook tests so the new performance role becomes visible in required workflow roles and blocks commit when missing.
2. Verify workflow prompts, instructions, and skills all describe QA's new testing-layer judgment consistently.
3. Verify README and release automation docs reflect the same stable workflow facts.