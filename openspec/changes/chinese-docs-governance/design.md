## Context

The repository already expects structured delivery and formal documentation planning, but the current rules stop short of making documentation language and documentation-update checks explicit default policy.

This slice hardens those expectations at the repository instruction layer instead of relying on one-off conversation context.

## Goals / Non-Goals

**Goals:**
- Make Chinese-first README and official docs a repository-level default.
- Require each delivery round to assess whether README and official docs should be updated.
- Keep the policy aligned across core instructions, workflow prompt, documentation owner guidance, and docs planning.

**Non-Goals:**
- No full README rewrite in this slice.
- No docs-site implementation in this slice.
- No automatic blocking hook for semantic documentation checks.

## Decisions

### 1. Put the hard rule in repository instructions

The strongest default should live in `.github/copilot-instructions.md`, because that file governs the main coding workflow across conversations.

### 2. Reinforce the rule in the default workflow prompt

The workflow prompt should remind agents that every round must explicitly assess whether README and official docs need updates.

### 3. Keep the Documentation Owner and docs planning aligned

The Documentation Owner agent and official docs planning document should reflect the same Chinese-first policy so execution and planning stay consistent.

## Validation Strategy

1. Verify the new policy is present in repository-level instructions.
2. Verify the default workflow prompt now requires README and official docs update checks each round.
3. Verify the Documentation Owner agent and official docs planning doc use the same Chinese-first policy wording.