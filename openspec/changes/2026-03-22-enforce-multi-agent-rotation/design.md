## Context

The repository already has the right primitives for structured collaboration: dedicated agents, delivery skills, session hooks, and OpenSpec guidance. What it lacks is a repository-owned state machine that can prove whether a session has actually walked through the intended roles. Today, the system only communicates desired behavior through instructions and prompts, which makes the workflow easy to skip whenever an implementation request becomes urgent.

The platform currently exposes two hook points that are already in use: `SessionStart` and `PreToolUse`. That means the strongest enforceable model is a stateful gate rather than a full orchestration engine. The repository can inject expectations at session start, and it can deny high-risk actions before they execute. It cannot, by itself, automatically launch and validate every agent exchange after the fact.

This design therefore treats role rotation as a repository-level compliance state machine. Required roles are derived from the declared workflow mode, completed or waived roles are recorded durably for the session, and high-risk actions are blocked when upstream gates are still missing.

## Goals / Non-Goals

**Goals:**
- Enforce a durable record of multi-agent role rotation for substantial work before code edits, commits, pushes, and release-like actions proceed.
- Support explicit waivers so trivial or specialized tasks do not require irrelevant roles, while still leaving an audit trail.
- Keep the implementation inside the repository's existing customization surface: hooks, agent instructions, skills, and OpenSpec artifacts.
- Preserve CI-first release automation while adding stronger local governance before a release candidate is pushed toward automation.

**Non-Goals:**
- Build a fully autonomous multi-agent scheduler that can independently invoke and verify every subagent.
- Guarantee the semantic quality of each role's output beyond recording that the role was completed or waived.
- Block pure conversational analysis that never reaches an edit, commit, or release action.
- Replace GitHub Actions as the final release authority.

## Decisions

### 1. Store workflow progress in a hook runtime state file
The repository will keep the current session's workflow state in a JSON file under `.github/hooks/runtime/`, excluded from version control. This state file will track workflow mode, active change, required roles, completed roles, waived roles, and a history log.

Why:
- `SessionStart` can initialize it.
- `PreToolUse` can read it cheaply on every gated action.
- The main coding agent can update it through a repository-owned helper script after each role handoff.

### 2. Add a role rotation helper CLI instead of encoding all state changes directly in hook logic
A dedicated helper script will expose stable commands for:
- `init`
- `complete`
- `waive`
- `status`
- `reset`

Why:
- The main agent needs a deterministic way to keep state synchronized after subagent calls.
- The hook scripts stay focused on policy decisions rather than mutation mechanics.
- Future workflow tooling can reuse the same interface.

### 3. Use workflow modes with aggressive defaults and explicit waivers
The state machine will support a small number of workflow modes. Substantial implementation mode will default to the full development chain, while release mode will add the marketing role.

Recommended defaults:
- `analysis`: no mandatory roles
- `planning`: Workflow Expert, Product Manager, UI UX Director, Rules Expert, Tech Lead
- `implementation`: Workflow Expert, Product Manager, UI UX Director, Rules Expert, Tech Lead, Senior Implementer, QA Lead, Simulated Player, Versioning Manager
- `release`: Workflow Expert, Product Manager, UI UX Director, Rules Expert, Tech Lead, Senior Implementer, QA Lead, Simulated Player, Versioning Manager, Release Marketer

The `Monopoly Pixi Scene Engineer` remains a conditional specialist. It is expected for board-scene-heavy frontend work, but not required for every implementation slice.

Why:
- The manager's request is to force the full role rotation, not merely recommend it.
- Explicit waivers preserve practicality for backend-only or emergency work while still requiring conscious acknowledgment.

### 4. Gate by action class instead of trying to judge every conversation semantically
The pre-tool policy will classify attempted actions into three governance checkpoints:
- `edit`: code or repository file modifications
- `commit`: `git commit` and `git push`
- `release`: release-like commands such as `pnpm release`, `semantic-release`, `git tag`, or GitHub Release commands

Required roles per checkpoint:
- `edit`: all required roles except downstream release-only roles, with QA and simulated player still deferred
- `commit`: all required roles except release marketer
- `release`: all required roles

Why:
- Hooks are reliable when blocking concrete actions.
- This avoids over-classifying harmless read-only exploration.

### 5. Keep manual release creation blocked while strengthening release-readiness gates
The repository already prefers CI-first release authority. That remains unchanged. The new enforcement adds release-readiness validation before any local release-like command is attempted, but it does not switch the release source of truth away from GitHub Actions.

### 6. Make workflow compliance visible in the agent instructions and skill entrypoints
The session startup message, workflow expert agent, tech lead agent, delivery skill, and playtest gate skill will all describe the required state updates and the expected command pattern for recording completion or waivers.

Why:
- Without a post-tool hook, the main agent must take responsibility for updating the state file.
- The instructions need to make that behavior explicit and repeatable.

## Risks / Trade-offs

- [False-positive blocking on trivial work] → Use an explicit `analysis` mode and waiver support; keep gates tied to edit, commit, and release actions.
- [Agent forgets to update workflow state] → Session start message and workflow entrypoints will spell out the required helper commands; the hook will fail closed on gated actions.
- [Too much friction for backend-only fixes] → Allow role waivers with mandatory reasons instead of silently shrinking the required roster.
- [Local repository gate still cannot auto-run subagents] → Accept that the repository can enforce evidence of rotation, not autonomous orchestration.
- [Existing hook checks become harder to maintain] → Factor state handling into a shared helper module and keep command safety logic separate from workflow gate logic.

## Migration Plan

1. Add a new OpenSpec change for enforced multi-agent workflow.
2. Introduce runtime state helpers and the role rotation CLI.
3. Update session start initialization to create a fresh workflow state and expose the protocol to the coding agent.
4. Update the pre-tool hook to enforce workflow gates on edit, commit, push, and release-like actions.
5. Update the relevant agent and skill documents so the main coding agent records completions and waivers consistently.
6. Validate the helper commands and hook decisions with representative workflow scenarios.

## Open Questions

- Whether future platform support will add a post-tool hook that can automatically register subagent completion without requiring the main agent to call the helper script.
- Whether a dedicated OpenSpec capability should later be added for emergency hotfix workflows with a narrower default roster.