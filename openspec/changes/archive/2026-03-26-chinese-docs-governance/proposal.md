## Why

The repository already has README and official documentation planning, but it does not yet state two workflow rules strongly enough:

- README and official docs should be Chinese-first by default
- each delivery round must explicitly decide whether README and official docs need updates

Without a hard repository rule, documentation language and update discipline can drift between conversations.

## What Changes

- Add repository-level documentation governance rules for Chinese-first README and official docs.
- Add workflow-level guidance that each round must assess README and official docs update needs.
- Align the Documentation Owner agent and official docs planning document with the same policy.

## Capabilities

### New Capabilities
- `documentation-governance`: the repository gains explicit Chinese-first documentation policy and per-round documentation update checks.

## Impact

- Affected code: repository instructions, workflow prompt, documentation owner guidance, documentation planning docs, OpenSpec artifacts.
- Runtime behavior: none.
- Team impact: lower documentation drift and clearer default language policy.