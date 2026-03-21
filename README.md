# Da-Fu-Weng

Web-first multiplayer Monopoly project.

## Overview

- `frontend/`: React + TypeScript + Vite + PixiJS web client.
- `backend/`: Go + PocketBase-oriented authoritative backend skeleton.
- `packages/`: shared contracts and board configuration.
- `apps/`: desktop, mobile, and Harmony shell boundaries.
- `openspec/`: product and engineering change workflow.

## Workflow

- Use OpenSpec for substantial changes.
- Use conventional commits for all merge-worthy history.
- Treat GitHub Actions as the primary validation and release system.

## Quick Start

```bash
pnpm install
pnpm check
pnpm dev:frontend
```

## Documentation

- Architecture: `docs/architecture/overview.md`
- Release automation: `docs/release/automation.md`
- Active change: `openspec/changes/web-first-authoritative-multiplayer-foundation/`