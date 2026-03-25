## Context

Persistent iteration policy is now codified and CI-validated, but pull requests still do not consistently capture what slice landed, how it was validated, what remains risky, and what should happen next.

This pass extends that governance into PR evidence without changing release triggers.

## Goals / Non-Goals

**Goals:**
- Add a stable PR template for slice-level delivery reporting.
- Validate PR bodies in CI on pull_request events.
- Keep the new rule objective and lightweight.
- Preserve the existing release workflow chain.

**Non-Goals:**
- No release trigger changes.
- No attempt to score prose quality or inspect agent conversation transcripts.
- No gameplay, backend, or frontend feature changes.
- No expansion into labels, bots, or project boards.

## Decisions

### 1. Use a versioned PR governance policy file

Store required PR headings in a repository policy file.

Why:
- The structure becomes reviewable and reusable by both CI and tests.

### 2. Add a repository-level PR template

The repository will ship one PR template with the required sections.

Why:
- Authors should see the required fields before CI rejects them.

### 3. Validate only structure and minimum content

The validator will ensure required sections exist and are not left as placeholders.

Why:
- This keeps CI objective and avoids brittle subjective scoring.

### 4. Run the PR governance validator only on pull_request events inside ci

The new job will be added to the existing ci workflow with a pull_request-only condition.

Why:
- This preserves the current release workflow contract that only cares whether ci succeeded.

## Risks / Trade-offs

- [Authors may see the new template as extra friction] -> Acceptable because the required fields directly improve review clarity and iteration continuity.
- [Validation could be too strict about template placeholders] -> Acceptable because the check only requires non-placeholder content under each heading.
- [push-to-main CI must not fail due to missing PR context] -> Acceptable because the new job only runs on pull_request events.

## Validation Strategy

1. Run the PR governance validator against unit-test fixtures.
2. Run the hook script unit test suite.
3. Verify the ci workflow accepts the new pull_request-only job shape.