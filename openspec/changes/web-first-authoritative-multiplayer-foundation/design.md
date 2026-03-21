## Context

This change establishes the first end-to-end foundation for a classic Monopoly-style multiplayer game in a repository that currently has no application code. The project is intentionally web-first, with desktop and mobile clients treated as shells around the same web application, and with HarmonyOS support delivered through ArkWeb plus a JavaScript bridge boundary.

The core constraint is that multiplayer fairness and state consistency cannot depend on the client. Room state, turn ownership, dice resolution, movement, tile effects, ownership, rent, jail, cards, bankruptcy, reconnection recovery, and match completion must be server authoritative. At the same time, the frontend must still feel like a premium digital board game, not an admin panel, which means rendering and animation concerns must remain separate from the rules engine.

The repository also needs a delivery baseline that does not rely on manual release management. Conventional commits, CI-first validation, automated semantic versioning, changelog generation, release-note generation, and GitHub Releases all need to be built into the project structure from the start.

Stakeholders for this design are product, UI/UX, gameplay engineering, QA, release automation, and future shell integration work.

## Goals / Non-Goals

**Goals:**
- Create a project structure that supports a web-first Monopoly game with shared contracts and explicit frontend/backend boundaries.
- Define a server-authoritative multiplayer architecture using Go plus PocketBase for identity, storage, and realtime support.
- Keep gameplay rules deterministic, configuration-driven, and testable through a dedicated rules and orchestration layer.
- Support the browser client first while preserving a clean adapter boundary for Tauri desktop/mobile and HarmonyOS ArkWeb integration.
- Establish CI and release automation so versioning, changelogs, tags, GitHub Releases, and release notes are handled without manual intervention.

**Non-Goals:**
- Recreate every classic Monopoly rule in the first implementation slice.
- Deliver native-only platform-specific gameplay behavior.
- Build ranking, matchmaking ladders, spectating, replay playback, social systems, or monetization in this foundational change.
- Introduce manual version management, manually curated changelogs, or local-only release flows.

## Decisions

### 1. Use a web-first monorepo with explicit frontend, backend, shared packages, and shell adapters
The repository will be structured around `frontend/`, `backend/`, and `packages/`, with platform shells under `apps/` or platform-specific directories only as thin wrappers over the web client. This keeps gameplay rendering and backend orchestration reusable while preventing platform-specific forks of core logic.

Alternatives considered:
- Separate repositories per platform: rejected because it would fragment contracts and slow gameplay iteration.
- Native-first clients: rejected because the product direction explicitly prioritizes the web client as the core experience.

### 2. Make the backend authoritative for all gameplay outcomes
The backend will accept user intentions as commands and emit authoritative events and snapshots as the only source of truth for gameplay progression. The client may animate or optimistically highlight intent, but it must not decide dice values, ownership changes, or turn progression.

Alternatives considered:
- Client-authoritative rules with backend sync: rejected because it creates cheating, desync, and reconciliation risks.
- PocketBase-only hook logic: rejected because gameplay orchestration needs stronger modularity and testability than hook-only logic can provide.

### 3. Separate deterministic domain state from client projection and presentation state
The backend maintains domain state. The frontend rebuilds a projection store from authoritative snapshots and event streams. UI and animation state remain local and disposable. This three-way split prevents React components or PixiJS scenes from becoming accidental sources of business truth.

Alternatives considered:
- Storing full gameplay truth directly in frontend state: rejected because reconnects and cross-platform consistency become fragile.
- Combining animation state with domain state: rejected because it complicates replay, testing, and state restoration.

### 4. Use configuration-driven board and rule definitions
Board layout, tile types, card decks, rent values, starting cash, and rule variants will live in shared configuration packages rather than being hardcoded into UI components or backend conditionals. This keeps gameplay evolution testable and allows future board variants without rewriting core flow.

Alternatives considered:
- Hardcoded board logic in the frontend or backend: rejected because it slows balancing and raises change risk.

### 5. Use event sequencing plus snapshots for multiplayer sync and reconnects
Every room mutation will result in an ordered event with version metadata, and the backend will also persist snapshots suitable for recovery. Clients reconnect by loading a current snapshot and then continuing from the latest event sequence. This supports reconnect safety, auditability, and future replay support.

Alternatives considered:
- Snapshot-only sync: rejected because it loses visibility into transitions and complicates debugging.
- Event-only rebuild with no snapshots: rejected because recovery time and operational complexity grow too quickly.

### 6. Make CI the release authority using conventional commits and semantic release automation
GitHub Actions will run validation, packaging, and release jobs. Semantic versioning will be derived from conventional commits, and GitHub Releases plus changelogs will be generated automatically. Release notes will combine engineering facts with player-facing highlights.

Alternatives considered:
- Manual version bumps and tags: rejected because the repository direction is fully automated release management.
- Ad hoc changelog maintenance: rejected because it does not scale and becomes inconsistent.

### 7. Establish a test pyramid aligned to the game architecture
Pure gameplay rules will be covered with unit tests. Backend orchestration and persistence boundaries will use integration tests. End-to-end player journeys such as room creation, join, ready, turn progression, property purchase, rent payment, reconnect, and settlement will use Playwright. This matches the rule engine, orchestration, and UX layers with the appropriate validation depth.

Alternatives considered:
- E2E-heavy validation only: rejected because core gameplay rules should be deterministic and fast to validate.
- Unit-only validation: rejected because multiplayer session and reconnect behavior must be exercised end-to-end.

## Risks / Trade-offs

- [First implementation scope becomes too broad] → Limit the first code slice to room lifecycle, shared contracts, a minimal board scene, and CI automation before expanding gameplay rules.
- [PocketBase and Go boundaries become blurry] → Keep authoritative gameplay orchestration in Go and treat PocketBase as platform support plus persistence infrastructure.
- [Cross-platform support creates premature complexity] → Implement adapter boundaries now, but keep real platform-specific behavior thin until the web baseline is stable.
- [Reconnect support increases architecture complexity early] → Accept the extra structure because reconnect safety is a product requirement for multiplayer fairness.
- [Automation setup delays visible gameplay progress] → Deliver CI, release, and test scaffolding alongside the project skeleton so later feature work does not accrue delivery debt.
- [Semantic release tooling may require repository settings or secrets not yet configured] → Document required secrets and keep workflows composable so missing release credentials do not block validation jobs.

## Migration Plan

1. Create the monorepo folder structure and shared package boundaries.
2. Scaffold the web client, backend service, shared contracts, and board configuration packages.
3. Add initial GitHub Actions workflows for validation and release automation.
4. Introduce minimal gameplay and room contracts in a way that future features can extend without breaking the initial package layout.
5. Roll forward by implementing tasks in sequence; rollback is low-risk because this change is foundational scaffolding rather than a live migration of an existing product.

## Open Questions

- Should the initial playable slice support two to four players only, or reserve protocol space for up to six players now?
- Which exact jail and bankruptcy simplifications belong in the first gameplay milestone?
- How much shell scaffolding should be committed now versus added only when the web client is stable enough to embed?
- Which release artifacts should be published first: web packages only, or placeholders for Tauri and backend artifacts as well?
