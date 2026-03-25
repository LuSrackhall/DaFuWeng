## Why

The project already has gameplay E2E coverage, but E2E is too slow and too coarse to be the main regression layer for deterministic Monopoly rules. At the same time, the repository has no fixed workflow role dedicated to cross-layer performance and memory review, even though multiplayer recovery, long sessions, and Pixi-heavy presentation can degrade over time.

The workflow needs two durable upgrades:

- unit and integration coverage must become the default fast confidence layers, with QA explicitly judging when tests are lagging behind implementation
- a fixed full-stack performance checkpoint must exist for substantial rounds

## What Changes

- Add a fixed `Monopoly Full-Stack Performance Expert` role to the repository workflow.
- Strengthen repository workflow assets so QA explicitly judges unit, integration, and E2E coverage drift every substantial round.
- Clarify that Playwright remains a final player-journey proof layer, not the primary regression layer for deterministic logic.
- Sync hooks, tests, agents, prompts, instructions, skills, README, and release automation documentation.

## Capabilities

### New Capabilities
- `workflow-quality-and-performance-governance`: substantial rounds require explicit testing-layer and performance-risk review.

## Impact

- Affected code: workflow hooks, tests, agent definitions, prompts, instructions, skills, README, release automation docs, OpenSpec artifacts.
- Runtime behavior: none for the game runtime.
- Team impact: faster regression feedback, clearer QA accountability, and performance review becomes auditable instead of optional.