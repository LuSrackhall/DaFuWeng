## Why

The repository already contains a rich Monopoly-focused AI roster, OpenSpec workflow, and CI-first automation guidance, but the actual collaboration path is still advisory. A coding session can skip the intended role rotation entirely and go straight into implementation, commit preparation, or release-related changes without any durable evidence that product, UX, architecture, QA, or playtest review happened.

That gap creates two problems. First, the repository does not yet enforce the manager's requirement that substantial development work should pass through a structured multi-agent workflow. Second, the current hook system only guards command safety and commit formatting, so it cannot distinguish between a well-governed delivery slice and an ad hoc implementation burst.

This change upgrades the repository from a recommendation-based multi-agent workflow to a hook-enforced, stateful workflow gate. The goal is not to make hooks automatically run every agent, which the current platform cannot guarantee, but to make the repository block high-risk actions until every required role has either produced recorded output or been explicitly waived with a reason.

## What Changes

- Add a repository-managed role rotation state file for each session, stored under the hook runtime area and excluded from version control.
- Add a helper CLI for initializing workflow mode, marking role completion, recording waivers, and inspecting missing gates.
- Upgrade the existing pre-tool policy hook so it blocks code edits, commits, pushes, and release-like commands until the required multi-agent roles are completed or explicitly waived.
- Update session initialization and multi-agent customization docs so the main coding agent must keep the workflow state in sync as part of normal operation.
- Expand the roster with a Monopoly rules expert, a Pixi scene engineer, and a versioning manager so gameplay review, scene engineering, and release governance each have a dedicated role.
- Promote `ui-ux-pro-max` from a local prompt asset into the formal workflow as a required second UI/UX expert reference.
- Add OpenSpec capability coverage for enforced multi-agent workflow, explicit waivers, and release-ready role gates.

## Capabilities

### New Capabilities
- `multi-agent-delivery-enforcement`: Require repository-tracked role rotation or waiver records before high-risk development actions continue.

### Modified Capabilities
- `release-automation`: Release-related actions now depend on explicit QA, playtest, and release communication gates rather than only commit history and CI success.

## Impact

- Affected code: `.github/hooks/`, `.github/agents/`, `.github/skills/`, `.github/copilot-instructions.md`, and repository ignore rules.
- Affected systems: Copilot session startup, pre-tool policy decisions, multi-agent delivery orchestration, commit readiness, and release governance.
- Affected workflows: substantial implementation work, QA sign-off, playtest readiness, and release candidate preparation.
- Dependencies: existing hook command execution, repository agents, OpenSpec, and GitHub Actions release automation.
