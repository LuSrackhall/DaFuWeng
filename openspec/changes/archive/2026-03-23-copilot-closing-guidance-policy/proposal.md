## Why

The repository now relies heavily on multi-turn AI collaboration, but final replies still leave too much freedom in how the next step is proposed.

That creates room for weak handoffs, vague follow-up prompts, and inconsistent advice on whether a new conversation is needed.

## What Changes

- Add a mandatory Closing Guidance block to repository-level Copilot instructions.
- Force every final reply to end with exactly one next-best prompt and one absolute new-conversation recommendation.
- Define fixed field order and forbid hedged wording.

## Capabilities

### New Capabilities
- None.

### Modified Capabilities
- Repository AI workflow guidance now enforces a stronger, more deterministic final handoff pattern.

## Impact

- Affected code: repository Copilot instructions and OpenSpec workflow artifacts.
- Runtime behavior: no application runtime changes.
- Systems: AI workflow policy only.