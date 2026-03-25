## Context

The repository already contains README, architecture docs, release docs, and a newly introduced Documentation Owner agent, but the first-edition official docs-site structure is not yet captured as a formal repository artifact.

This pass turns the current planning into a concrete Chinese-first documentation plan that can guide future docs-site implementation.

## Goals / Non-Goals

**Goals:**
- Capture homepage messaging boundaries for the first official docs site.
- Define top navigation, sidebar structure, and a practical docs-site tree.
- Define README slimming boundaries so README stays entry-oriented.

**Non-Goals:**
- No docs-site implementation in this pass.
- No README rewrite in this pass.
- No runtime or release-system changes.

## Decisions

### 1. Keep the planning document Chinese-first and repository-facing

The planning document should be immediately usable by the current team, so the formal text is written in Chinese and aligned to current repository facts.

### 2. Treat README and official docs as different products

README remains the fast-entry document, while the official docs site becomes the durable structured explanation layer.

### 3. Keep homepage focused on system truth and reading paths

The homepage should emphasize Web-first product truth, backend authority, and platform-shell boundaries rather than detailed setup or unshipped capabilities.

## Validation Strategy

1. Verify the planning document is consistent with current README, architecture docs, and release docs.
2. Verify the OpenSpec artifacts match the repository's spec-driven structure.
3. Confirm the planning document is specific enough to guide a later docs-site implementation slice.