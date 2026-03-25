---
name: monopoly-multi-agent-delivery
description: 'Coordinate product, UX, architecture, implementation, QA, playtest, and release readiness for Monopoly, 大富翁, features using OpenSpec and the custom agent roster in this repository.'
argument-hint: 'Describe the feature, subsystem, or milestone to deliver'
user-invocable: true
---

# Monopoly Multi-Agent Delivery

Use this skill when a feature or milestone needs coordinated execution with minimal user involvement.

## Continuous Iteration Policy

This skill must respect the repository's continuous iteration policy.

- Treat continuous iteration policy as the default delivery posture until the current slice is fully landed and validated.
- After each completed slice, propose several concrete next steps, but never weaken validation or product quality.
- Use careful thinking, deep research, and end-to-end completion before handing work back.

## When To Use

- A new gameplay feature needs to move from idea to implementation.
- A subsystem touches both frontend and backend.
- A release candidate needs structured review across product, UX, engineering, QA, and playtesting.

## Procedure

1. Initialize workflow state.
   - For substantial work, run `.github/hooks/scripts/role_rotation.py init --mode <planning|implementation|release> --change <active-change>` before any repository edits.
   - Use explicit waivers later when a role does not apply, rather than silently skipping it.
2. Frame the request in product terms.
   - Call the `Monopoly Product Manager` agent when scope, user value, or rules clarity are weak.
3. Clarify the experience.
   - Call the `Monopoly UI UX Director` agent when board readability, interaction flow, motion, or shell ergonomics matter.
4. Run the second UI/UX review.
   - Call the `Monopoly UI UX Pro Max` agent or use the `ui-ux-pro-max-monopoly` skill so UI/UX decisions are challenged by the local pro-max asset library.
5. Review Monopoly rules and OpenSpec alignment.
   - Call the `Monopoly Rules Expert` agent to validate that proposal, design, and specs still fit the classic Monopoly mental model.
6. Lock the technical shape.
   - Call the `Monopoly Tech Lead` agent to define architecture slices, state boundaries, and automation impact.
7. Review performance risk before implementation deepens.
   - Use the `Monopoly Full-Stack Performance Expert` agent for substantial rounds that may affect rendering cost, memory pressure, recovery latency, event volume, or long-session stability.
8. Route through OpenSpec.
   - Create or continue an OpenSpec change before substantial implementation.
   - Ensure proposal, design, and tasks are present before code-heavy work begins.
9. Add Pixi specialization when board rendering is central.
   - Call the `Monopoly Pixi Scene Engineer` agent when the task primarily concerns Pixi scene structure, camera movement, piece animation, or canvas performance.
10. Implement in thin slices.
   - Use the `Monopoly Senior Implementer` agent for code changes and validation.
11. Build the quality gate.
   - Use the `Monopoly QA Lead` agent to define or review unit, integration, and Playwright coverage.
   - Require an explicit verdict on whether any of those layers are lagging and whether failing checks imply stale tests or business-logic regressions.
12. Review long-lived documentation impact.
   - Use the `Monopoly Documentation Owner` agent every substantial round to decide whether README or official docs must be updated.
   - Record an explicit "updated" or "checked and no changes needed" conclusion before commit.
13. Simulate the player experience.
   - Use the `Monopoly Simulated Player` agent before tagging or declaring a milestone ready.
14. Wait for user confirmation when the change is user-facing or milestone-like.
   - Treat user approval as a release or commit boundary, not as an AI specialist role.
15. Review version impact before commit or release handoff.
   - Use the `Monopoly Versioning Manager` agent to confirm semantic version impact, commit classification, and changelog-ready release facts.
16. Start with workspace hygiene.
   - Check git status before new implementation work.
   - If completed agent-owned work is still uncommitted, decide whether to commit and push it before starting the next slice.
   - Keep unrelated user changes out of agent commits and report them explicitly.
17. Record the workflow state after every role handoff.
   - After each required role or waiver decision, run `.github/hooks/scripts/role_rotation.py complete --role "<role name>" --note "<summary>"` or `.github/hooks/scripts/role_rotation.py waive --role "<role name>" --reason "<reason>"`.
   - Use `.github/hooks/scripts/role_rotation.py status --json` before editing, committing, or preparing release work.
18. Close the loop with management reporting.
   - In progress updates and the final summary, include a role-by-role account of which AI roles were used, what each one contributed, and which work remained with the main coding agent.
   - If no supporting roles were used, state that explicitly.
19. Use repository-friendly commits.
   - Prefer conventional commit messages with Chinese subjects when committing implementation slices.

## Role Boundary Reminder

- `Monopoly Documentation Owner` is now an every-round governance checkpoint for substantial work.
- `Monopoly Full-Stack Performance Expert` is a fixed workflow role for substantial rounds, while `Monopoly Pixi Scene Engineer` remains a specialized opt-in role when board rendering is central.
- `Monopoly Release Marketer` still exists, but it remains a release and external-facing messaging role rather than an implementation-round default gate.

## Output

- A recommended agent sequence
- The OpenSpec change to create or continue
- The next implementation slice
- The required validation and playtest gate
- A role-by-role execution summary suitable for manager review
