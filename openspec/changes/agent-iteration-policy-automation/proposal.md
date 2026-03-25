## Why

The repository already enforces workflow and release discipline, but a recurring user-level delivery policy still lives mostly in repeated chat prompts instead of versioned automation.

That means the policy can drift across conversations and cannot be checked by CI.

## What Changes

- Add a repository-level agent iteration policy source file.
- Validate that key instruction and skill assets remain synchronized with that policy.
- Add a dedicated CI job to enforce the policy wiring.
- Extend the session-start hook so local agent sessions inherit the same policy summary.

## Capabilities

### New Capabilities
- `release-automation`: CI can validate that the repository's persistent agent iteration policy remains wired into core agent guidance assets.

### Modified Capabilities
- `release-automation`: local agent session defaults now include the repository's persistent iteration policy summary.

## Impact

- Affected code: GitHub Actions, hook scripts, hook tests, agent instructions, and workflow skill guidance.
- Release behavior: unchanged trigger chain; only CI validation coverage expands.
- Product behavior: no gameplay or backend changes.