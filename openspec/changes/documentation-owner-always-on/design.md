## Context

The repository already states that each round must decide whether README and official docs need updates. However, the role-rotation hook does not include `Monopoly Documentation Owner`, so the workflow cannot enforce that decision. At the same time, `Monopoly Release Marketer` is present in assets and hooks, but only as a release role, which makes the role look absent during normal implementation rounds.

## Goals / Non-Goals

**Goals:**
- Make `Monopoly Documentation Owner` a required workflow role for planning, implementation, and release.
- Require a recorded docs-review conclusion before commit.
- Clarify that `Monopoly Release Marketer` still exists and remains release-only by design.
- Keep the enforcement source centralized in hooks and backed by tests.

**Non-Goals:**
- No gameplay or product behavior changes.
- No new agent types.
- No expansion of `Monopoly Release Marketer` into routine implementation rounds.

## Decisions

### 1. Hooks remain the single enforcement source

`role_rotation_state.py` remains the hard gate. Prompts, instructions, skills, and agent descriptions only mirror the same rule for discoverability and clarity.

### 2. Documentation Owner is deferred for edit, but required before commit

Documentation review depends on the actual slice that was implemented, so `Monopoly Documentation Owner` should not block the first edit. It should, however, block commit and release until a review or waiver is recorded.

### 3. Release Marketer stays release-only

`Monopoly Release Marketer` is not missing. It remains intentionally limited to release and external-facing messaging. The fix is clarification, not widening its default scope.

## Validation Strategy

1. Update hook tests so implementation commits fail when `Monopoly Documentation Owner` is missing.
2. Preserve the existing rule that release actions fail when `Monopoly Release Marketer` is missing.
3. Verify the prompts, instructions, skill, agents, and README all describe the same workflow boundary.