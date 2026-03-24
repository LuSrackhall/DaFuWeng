## Context

The repository already has a usable default Playwright lane, but clean local validation currently requires ad hoc commands or temporary config files.

That is brittle because frontend preview, backend health checks, API base URL resolution, and PocketBase data isolation must all move together.

## Goals / Non-Goals

**Goals:**
- Provide a formal local clean e2e entrypoint.
- Keep the default Playwright workflow intact.
- Ensure isolated frontend preview and backend ports stay aligned with the frontend API base URL.

**Non-Goals:**
- No gameplay changes.
- No CI workflow changes in this slice.
- No new browser automation features beyond configuration and scripting.

## Decisions

### 1. Use one Playwright config with environment-driven execution profiles

Parameterize frontend port, backend port, API base URL, PocketBase data path, fixed dice, and server reuse inside the existing Playwright config.

Why:
- This avoids maintaining a second config file while still supporting clean isolation lanes.

### 2. Add a formal clean e2e script

Expose an npm script that disables server reuse, moves frontend and backend to alternate ports, and isolates the PocketBase data file.

Why:
- Developers need a reproducible local command that behaves like a clean-room validation pass, not an ad hoc shell recipe.

### 3. Frontend preview must build against the same isolated API base URL

Inject the API base URL into the frontend build command used by Playwright preview.

Why:
- Changing only the backend port is insufficient if the built frontend still points at the default backend origin.

## Risks / Trade-offs

- [More environment variables increase config surface area] -> Acceptable because they are tightly scoped to e2e execution.
- [Default and clean lanes may drift over time] -> Acceptable for now because both lanes still share a single Playwright config.

## Migration Plan

1. Parameterize the existing Playwright config.
2. Add the formal clean e2e script.
3. Verify lint still passes.
4. Verify the clean lane runs the current reconnect-focused validation subset successfully.