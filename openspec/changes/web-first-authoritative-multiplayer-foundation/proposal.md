## Why

This repository needs a concrete, end-to-end foundation for a classic Monopoly-style multiplayer game before feature work can scale. The project needs a web-first product architecture, an authoritative backend, and a CI-driven release pipeline now so gameplay, cross-platform shells, and release automation all evolve from a single coherent base instead of fragmenting early.

## What Changes

- Create the initial web-first product foundation for a classic multiplayer Monopoly game, with the browser client as the primary application and desktop/mobile platforms treated as shells around the same web experience.
- Define a server-authoritative multiplayer model for room lifecycle, turn progression, dice resolution, movement, property ownership, rent, jail, cards, bankruptcy, reconnection, and end-of-game settlement.
- Establish a shared contract and configuration-driven model for board data, rules, cards, and event payloads so gameplay rules remain deterministic and extensible.
- Create the first playable application structure across `frontend/`, `backend/`, shared packages, and shell adapters for Tauri and HarmonyOS integration boundaries.
- Add automated quality and release foundations using GitHub Actions, conventional commits, semantic versioning, changelog generation, GitHub Releases, and release-note automation.

## Capabilities

### New Capabilities
- `multiplayer-room-lifecycle`: Create, join, prepare, start, reconnect to, and finish multiplayer rooms with clear state transitions and host controls.
- `authoritative-turn-engine`: Resolve turns, dice rolls, movement, tile effects, property purchase, rent, jail, cards, bankruptcy, and victory through a server-authoritative rules engine.
- `web-game-client`: Render the board, room flows, player state, action prompts, and event feedback in a web-first client that projects authoritative backend state.
- `cross-platform-shell-adapters`: Reuse the web client through Tauri desktop/mobile shells and a HarmonyOS ArkWeb plus JS Bridge boundary without forking gameplay logic.
- `release-automation`: Validate, package, version, and release the project through GitHub Actions with automated tags, changelogs, release notes, and GitHub Releases.

### Modified Capabilities
- None.

## Impact

- Affected code: new `frontend/`, `backend/`, `packages/`, `.github/workflows/`, and platform shell scaffolding.
- Affected systems: PocketBase data and realtime usage, Go gameplay orchestration, web rendering stack, Playwright test strategy, and release automation.
- Affected APIs: room commands, gameplay commands, realtime event contracts, snapshot or recovery flows, and release pipeline conventions.
- Dependencies: React, TypeScript, Vite, PixiJS, PocketBase, Go tooling, Playwright, Tauri tooling, and semantic release tooling.
