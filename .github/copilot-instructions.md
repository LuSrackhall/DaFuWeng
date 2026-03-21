# Project Guidelines

## Product Direction

- This repository builds a classic Monopoly-style multiplayer game with a web-first architecture.
- The web client is the primary product. Desktop and mobile builds are shells around the web experience unless a platform capability forces a native bridge.
- Target clients are:
  - `frontend/`: web app, shared UI, shared gameplay presentation
  - Tauri shells for Windows, macOS, Linux, Android, and iOS
  - HarmonyOS shell through ArkWeb plus a JavaScript bridge contract aligned with the web app
- The backend lives in `backend/` and uses Go plus PocketBase.

## Default Technical Choices

- Frontend default stack: React, TypeScript, Vite, PixiJS for board rendering and piece animation, DOM overlays for menus and forms.
- Frontend state should separate deterministic gameplay state from presentation state. Do not couple board rules to React components.
- Backend default architecture: PocketBase as the data and realtime foundation, with Go services or hooks implementing authoritative game rules.
- Multiplayer is a first-class requirement. Room state, turn resolution, dice results, property ownership, rent, jail, cards, and bankruptcy must be server authoritative.

## Delivery Workflow

- Use OpenSpec for any non-trivial product, architecture, gameplay, persistence, release, or automation work.
- Prefer the existing prompts and skills in `.github/prompts/` and `.github/skills/openspec-*` to create, continue, apply, verify, and archive changes.
- Keep change names in kebab-case.
- Before implementation, make sure proposal, design, and tasks are present for the active change.

## Engineering Rules

- Favor config-driven board definitions so map tiles, cards, rent bands, and rule variants can evolve without rewriting core logic.
- Keep gameplay rules deterministic and testable with pure functions wherever possible.
- Do not put business rules only on the client.
- Avoid single-player shortcuts in shared models. Local mock flows are acceptable only behind clear adapters.
- Maintain strict boundaries between gameplay engine, transport layer, persistence, and rendering.

## UX Rules

- The UI should feel like a premium board game, not a generic admin panel.
- Preserve board readability on desktop, tablet, and phone layouts.
- Use expressive typography, strong visual hierarchy, and intentional motion.
- Gameplay feedback must make turn order, dice results, tile effects, cash movement, ownership, and pending decisions immediately clear.

## Testing And Quality

- Use unit tests for rule engines, rent calculation, movement, cards, jail rules, auctions, bankruptcy, and save or replay logic.
- Use Playwright for end-to-end flows such as room creation, matchmaking or invite flow, turn progression, property purchase, rent payment, chance or community chest resolution, reconnection, and settlement.
- Treat pre-release playtesting as required work, not optional polish.

## Release And Automation

- Versioning, changelog generation, Git tags, GitHub Releases, and release notes should be automated through GitHub Actions.
- Use conventional commits so automation can decide semantic version bumps.
- Prefer CI builds and release pipelines over local release operations.
- If a workflow changes release behavior, document the intended commit flow, version source of truth, and rollback path.