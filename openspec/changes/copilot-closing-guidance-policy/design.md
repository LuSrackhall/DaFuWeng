## Context

The repository already enforces detailed workflow and role-rotation rules, but the final user handoff still depends too much on model discretion.

This is a productivity problem rather than a gameplay problem.

## Goals / Non-Goals

**Goals:**
- Make final reply handoff deterministic.
- Require one highest-value next prompt instead of loose suggestions.
- Require an absolute recommendation on whether to start a new conversation.

**Non-Goals:**
- No application code changes.
- No gameplay, backend, or release behavior changes.
- No cross-repository memory policy changes.

## Decisions

### 1. Add a mandatory Closing Guidance block

Every final response should end with a dedicated Closing Guidance block as the absolute last section.

Why:
- This gives users a stable place to find the next action and session recommendation.

### 2. Enforce exactly one next prompt

The next prompt should be singular, concrete, and immediately executable.

Why:
- Multiple prompt options invite weak branching and reduce iteration focus.

### 3. Require an absolute new-conversation recommendation

The final response should state either that a new conversation is required or that it is not required, with no hedging.

Why:
- Users explicitly want less ambiguity and less room for lazy handoffs.

### 4. Define when a new conversation is actually required

The policy should explain that a new conversation is required only when the next step needs a new isolated workflow, a new active OpenSpec change, a materially different task scope, or a cleaner context boundary.

Why:
- This keeps the rule consistent and prevents arbitrary escalation to a new conversation.

## Risks / Trade-offs

- [The final response format becomes more rigid] -> Acceptable because this is a deliberate repository productivity policy.
- [Some tasks might feel over-structured] -> Acceptable because the user explicitly prefers stronger handoffs over looser conversation style.

## Migration Plan

1. Add OpenSpec artifacts for the Closing Guidance repository policy.
2. Update repository Copilot instructions with mandatory Closing Guidance rules.
3. Keep the policy scoped to repository instructions instead of user memory.