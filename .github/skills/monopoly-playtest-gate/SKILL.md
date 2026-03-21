---
name: monopoly-playtest-gate
description: 'Run a pre-tag playtest gate for Monopoly, 大富翁, releases by combining QA coverage review, simulated-player feedback, and final ship or hold recommendations.'
argument-hint: 'Describe the milestone, branch, or release candidate to evaluate'
user-invocable: true
---

# Monopoly Playtest Gate

Use this skill when a milestone is close to release and needs a player-focused go or no-go recommendation.

## When To Use

- Before creating a release tag or allowing CI to publish a release.
- After a feature-complete milestone needs experiential validation.
- When regression risk exists in gameplay clarity, pacing, or reconnect stability.

## Procedure

1. Review the implemented scope and known issues.
2. Ask the `Monopoly QA Lead` agent for the objective test gate.
3. Ask the `Monopoly Simulated Player` agent for experiential feedback.
4. Reconcile the two views.
   - Bugs that break rules or progression are blockers.
   - Confusing ownership, turn feedback, or cash flow are release-significant even if technically functional.
5. Produce a ship, ship-with-risk, or hold recommendation.

## Output

- Objective quality gate summary
- Player-experience findings
- Blocking issues
- Final release recommendation