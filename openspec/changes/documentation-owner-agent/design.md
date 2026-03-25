## Context

The project already maintains README, architecture notes, release automation artifacts, and OpenSpec changes. A future official docs site will add another public-facing layer.

This pass introduces a Documentation Owner agent to centralize README and docs governance without changing runtime code or release behavior.

## Goals / Non-Goals

**Goals:**
- Add a dedicated Documentation Owner agent aligned with existing repository agent conventions.
- Clarify its collaboration boundaries with Product Manager, Tech Lead, QA Lead, and Release Marketer.
- Record a recommended docs-site stack and first-pass structure for future implementation.

**Non-Goals:**
- No docs-site implementation in this pass.
- No runtime product or backend changes.
- No changes to release automation logic.

## Decisions

### 1. Use an agent, not an instruction or skill

The documentation responsibility is long-lived, role-shaped, and user-invocable, which matches the repository's `.agent.md` pattern.

### 2. Keep the role focused on documentation governance

The new role should manage README, official docs structure, and consistency checks, but not override product, architecture, QA, or release decisions.

### 3. Recommend Nextra plus Next.js on Vercel for the first docs site

The project is already web-first and React-oriented, so Nextra aligns with the stack while keeping first-pass docs-site setup lightweight and deployable.

## Validation Strategy

1. Confirm the new agent file matches existing repository agent conventions.
2. Verify the role definition clearly separates documentation governance from other existing agents.
3. Review the proposed docs-site stack and first-pass tree for realism against the current repository structure.