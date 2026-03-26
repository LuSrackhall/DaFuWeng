# Proposal

## Why

The repository already has strong deterministic rules testing and a growing Playwright suite for room flows and recovery paths, but it still lacks a stable evidence layer for human-facing UI review.

Today, major frontend changes can still pass type checks and happy-path end-to-end assertions while regressing:

- layout clarity on desktop or mobile
- CTA discoverability during key turn states
- visible hierarchy between board, status, and action surfaces
- spectator or reconnect comprehension
- human-readable decision density during high-pressure moments

This slice adds a repository-level workflow that combines deterministic Playwright screenshots, image-based review, and human-centered usability judgment.

## What Changes

- Add a dedicated Playwright screenshot evidence spec for stable room UI review.
- Add a targeted npm script for running the screenshot evidence workflow.
- Update repository workflow assets so substantial frontend UI work defaults to screenshot evidence plus image review.
- Document the workflow as a formal contribution and quality-gate asset.
- Produce real screenshot artifacts and review them from a human-player perspective.

## Capabilities

### New Capabilities

- `ui-review-workflow`: The repository can capture deterministic Playwright screenshots for key front-end states and use them as evidence for human-centered UI review.

### Modified Capabilities

- `testing-release`: Frontend quality evidence now includes a screenshot review lane in addition to unit, integration, and end-to-end checks.

## Impact

- Affected code: frontend Playwright coverage, package scripts, repository instructions, workflow prompts, agent guidance, and official workflow documentation.
- APIs and persistence: no backend protocol or gameplay persistence changes are required.
- Systems: frontend quality evidence, UX review consistency, mobile responsiveness review, and contribution workflow guidance.

## Scope

### In Scope For The First Slice

- one dedicated screenshot evidence Playwright spec
- one deterministic screenshot matrix covering desktop player, desktop decision, and mobile spectator views
- one targeted npm script for running the screenshot evidence flow
- repository instructions and prompts that require screenshot evidence for substantial player-visible frontend work
- updated role guidance for QA Lead, UI UX Pro Max, and Simulated Player
- one official documentation page describing the workflow

### Explicitly Out Of Scope

- no pixel-perfect visual regression gate for every frontend change
- no replacement of business E2E or deterministic unit and integration tests
- no automatic hook-based blocking for all frontend edits
- no full CI rollout of screenshot review as a required status check in this first slice
- no attempt to cover every gameplay state or every modal surface in the first matrix

## Acceptance Summary

This change is ready only if all of the following are true:

- the repository can generate stable Playwright screenshots for a small deterministic matrix of room states
- the workflow assets explicitly position screenshot review as human-centered evidence rather than logic regression replacement
- desktop and mobile screenshots can be reviewed with a fixed checklist for hierarchy, clarity, reachability, and crowding
- the new workflow is documented clearly enough that future frontend rounds can reuse it without rediscovery