# Design

## Context

The current repository has three strong foundations already:

1. deterministic business logic coverage in unit and integration layers
2. Playwright business-flow coverage for key room journeys and recovery paths
3. a multi-agent workflow that already includes QA, UI, and simulated-player checkpoints

What is missing is a stable evidence bridge between “the feature works” and “a human can immediately understand and operate this screen”.

This workflow should fill that gap without turning Playwright into a pixel-diff system or a replacement for business regression coverage.

## Goals / Non-Goals

**Goals**

- add a deterministic screenshot evidence lane for important frontend UI review
- keep screenshot review separate from business E2E responsibilities
- make image review and simulated-player judgment reusable in normal frontend rounds
- produce stable desktop and mobile screenshots for key room states
- document when the workflow should run and what it is supposed to prove

**Non-Goals**

- no full visual snapshot regression platform
- no attempt to cover every UI state in the first slice
- no hook-based enforcement for all repository changes
- no CI branch protection requirement in the first slice
- no gameplay rule or backend behavior changes

## Decisions

### 1. Split screenshot evidence from business E2E

The new workflow uses a dedicated Playwright spec instead of embedding screenshots into the existing business-flow suite.

Why:

- business E2E should continue proving player journeys and recovery semantics
- screenshot evidence should prove visual clarity and layout safety for stable states
- keeping them separate reduces noise, flake, and reviewer confusion

### 2. Use deterministic state fixtures and route mocking

The screenshot evidence lane should use mocked room states and controlled session identity rather than depending on a full live multiplayer loop.

Why:

- screenshot evidence must be stable and repeatable
- stable fixtures make it possible to compare layout, hierarchy, and action visibility across rounds

### 3. Keep the first screenshot matrix intentionally small

The first slice should ship with three default evidence scenes:

- desktop player view in a normal active-turn state
- desktop player view in a property-decision state
- mobile spectator view in a read-only in-game state

Why:

- this proves desktop and mobile coverage, player and spectator perspectives, and normal versus decision density without exploding maintenance cost

### 4. Store screenshots as evidence artifacts, not as pass/fail image baselines

The first slice should generate named screenshots into a stable review folder.

Why:

- the workflow is about human review evidence first
- image output should support QA, UI UX Pro Max, and Simulated Player review rather than automatic pixel gating

### 5. Update workflow assets instead of adding hooks

The repository should update:

- global instructions
- frontend instructions
- testing instructions
- the default workflow prompt
- relevant existing agents

The repository should not add a new hook in the first slice.

Why:

- instructions and prompts can make this a default workflow expectation without adding brittle local automation blockers

### 6. Treat screenshot review as player-understanding evidence

The workflow should review each screenshot against a small fixed checklist:

- can a player identify who acts now
- can a player find the main CTA quickly
- is any critical content hidden or crowded
- is the screen still readable on mobile
- is there an obvious wrong visual focus

Why:

- this keeps the workflow grounded in human usability rather than aesthetics alone

## Implementation Plan

### Repository Assets To Add Or Update

- `openspec/changes/playwright-human-ui-review-workflow/`
- `frontend/tests/e2e/ui-review.spec.ts`
- `frontend/package.json`
- `.github/copilot-instructions.md`
- `.github/instructions/frontend-gameplay.instructions.md`
- `.github/instructions/testing-release.instructions.md`
- `.github/prompts/monopoly-default-workflow.prompt.md`
- `.github/agents/monopoly-qa-lead.agent.md`
- `.github/agents/monopoly-ui-ux-pro-max.agent.md`
- `.github/agents/monopoly-simulated-player.agent.md`
- `docs/documentation/ui-screenshot-review-workflow.md`

### First Slice Acceptance

The first slice is complete only if:

- the screenshot spec can run independently from business-flow Playwright review
- screenshots are written to a predictable review folder
- the workflow assets clearly say when screenshot review is expected
- the screenshots can be inspected with image tools and produce a concrete human-centered review

## Validation Strategy

### Automated

- run the dedicated screenshot spec
- verify the expected screenshots are emitted
- keep the new script scoped to the screenshot review lane

### Human Review

- inspect the generated screenshots with image tools
- record blockers, major friction, medium issues, and minor polish notes
- confirm that the workflow helps judge normal human operation, not just rendering success

### Documentation

- confirm the official documentation page explains what the workflow is, when to run it, and what it does not replace

## Risks / Trade-offs

- [The screenshot matrix could expand too quickly] -> acceptable only if the first slice stays small and task-driven.
- [Reviewers might treat screenshots as visual regression gates] -> acceptable only if instructions explicitly say this is evidence, not pixel gating.
- [The workflow could be skipped in practice] -> acceptable only if global and frontend instructions make it part of substantial frontend rounds.
- [Mobile evidence could still miss interaction pain] -> acceptable for the first slice because screenshots are paired with simulated-player review rather than standing alone.