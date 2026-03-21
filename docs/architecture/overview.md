# Architecture Overview

## Layers

1. Web client in `frontend/`
2. Authoritative backend in `backend/`
3. Shared protocol and board config in `packages/`
4. Platform shells in `apps/`

## Core principles

- backend authority for all game outcomes
- config-driven board and rules
- event plus snapshot synchronization
- projection state separate from presentation state
- CI-first validation and release

## First implementation slice

- scaffold room lifecycle
- scaffold board projection UI
- scaffold shared contracts
- scaffold release automation