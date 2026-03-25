## Context

The repository already codifies workflow state, release automation, and OpenSpec structure, but it does not yet codify one persistent user delivery policy as a versioned, CI-enforced artifact.

This pass keeps release triggers unchanged and focuses on durable policy wiring.

## Goals / Non-Goals

**Goals:**
- Define one repository-level source of truth for the persistent iteration policy.
- Ensure CI validates that core agent guidance remains synchronized with that source.
- Surface the same policy summary in local session-start hook messaging.
- Keep the implementation small, testable, and automation-focused.

**Non-Goals:**
- No gameplay, backend, or UI changes.
- No release trigger changes.
- No attempt to inspect actual chat transcript quality in GitHub Actions.
- No new agent or skill orchestration framework.

## Decisions

### 1. Use a versioned policy file as the single execution source

Store the persistent user delivery policy in a repository-level JSON policy file.

Why:
- The policy becomes reviewable, diffable, and consumable by both CI and local hooks.

### 2. Add a dedicated CI policy validation job

CI will run a small Python validator that checks required target files for required policy snippets.

Why:
- The repository needs a durable enforcement point inside GitHub Actions, not just additional prose.

### 3. Reuse the existing session-start hook instead of adding new hook types

The session-start hook will load the policy summary and append it to the local system message.

Why:
- This preserves the existing hook wiring and avoids unnecessary hook sprawl.

### 4. Update only the core instruction and workflow skill surfaces

The repository-level copilot instructions and the main multi-agent delivery skill will be synchronized with the policy.

Why:
- These are the two highest-value text surfaces for persistent behavior without creating redundant copies everywhere.

## Risks / Trade-offs

- [Policy validation could be too brittle] -> Acceptable because the validator only checks a small number of required snippets in a small number of files.
- [Session-start message could grow too long] -> Acceptable because only the concise operational rules are appended, not the full policy payload.
- [More policy files could accumulate over time] -> Acceptable because this pass uses one source file and one validator instead of scattering rules.

## Validation Strategy

1. Run the new policy validator directly.
2. Run hook unit tests, including new policy tests.
3. Run the existing CI-relevant test suite affected by these changes.