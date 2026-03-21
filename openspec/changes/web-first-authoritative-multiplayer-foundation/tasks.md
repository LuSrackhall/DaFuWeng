# Tasks

## 1. Repository Foundation

- [x] 1.1 Create the monorepo folder structure for `frontend/`, `backend/`, `packages/`, `apps/`, and supporting docs.
- [x] 1.2 Add root workspace configuration for package management, formatting, linting, and shared scripts.
- [x] 1.3 Add repository documentation for architecture, development workflow, and release expectations.

## 2. Shared Contracts And Config

- [x] 2.1 Create a shared contracts package for room commands, gameplay commands, event payloads, and snapshot envelopes.
- [x] 2.2 Create a shared board configuration package for tiles, card decks, starting rules, and room settings.
- [x] 2.3 Add validation or test coverage for shared contracts and configuration integrity.

## 3. Frontend Web Client Skeleton

- [x] 3.1 Scaffold the React, TypeScript, and Vite web client with workspace-aware scripts.
- [x] 3.2 Add the initial app shell, routing, room screens, and game scene boundaries.
- [x] 3.3 Integrate a minimal PixiJS board scene and separate projection state from presentation state.
- [x] 3.4 Add frontend test scaffolding for unit tests and Playwright end-to-end tests.

## 4. Backend Authoritative Skeleton

- [x] 4.1 Scaffold the Go backend with entrypoints, internal modules, and configuration loading.
- [x] 4.2 Add PocketBase integration boundaries for auth, room metadata, and realtime-friendly persistence.
- [x] 4.3 Implement the initial room lifecycle and command validation skeleton with placeholder authoritative handlers.
- [x] 4.4 Add backend test scaffolding for unit and integration coverage.

## 5. Cross-Platform Shell Boundaries

- [x] 5.1 Create Tauri desktop shell scaffolding that embeds the shared web client.
- [x] 5.2 Create placeholder mobile and HarmonyOS adapter boundaries with documented bridge contracts.
- [x] 5.3 Add shared platform adapter interfaces so the web client can remain platform-agnostic.

## 6. CI, Release, And Quality Automation

- [x] 6.1 Add GitHub Actions workflows for linting, testing, and workspace validation.
- [x] 6.2 Add semantic release configuration driven by conventional commits.
- [x] 6.3 Add automated changelog, release-note, and GitHub Release publication scaffolding.
- [x] 6.4 Document required repository secrets, branch expectations, and release behavior.

## 7. Initial Verification

- [x] 7.1 Verify the workspace boots through the root scripts without requiring local release steps.
- [x] 7.2 Verify the OpenSpec artifacts, repository structure, and automation files stay aligned.
- [x] 7.3 Record follow-up tasks for the first playable gameplay milestone.

## 8. Playable Room Slice

- [x] 8.1 Replace the demo room endpoint with a minimal authoritative room snapshot API.
- [x] 8.2 Add room creation, join, and start endpoints with backend validation.
- [x] 8.3 Connect the web lobby and room pages to backend room data with local fallback rendering.
- [x] 8.4 Add CI end-to-end coverage for the web room shell.