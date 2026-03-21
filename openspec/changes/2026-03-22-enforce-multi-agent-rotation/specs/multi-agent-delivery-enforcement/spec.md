## ADDED Requirements

### Requirement: Substantial work sessions track required workflow roles in repository state
The system MUST initialize repository-managed workflow state for substantial work so required multi-agent roles, completed roles, waived roles, and the active change can be inspected before high-risk actions proceed.

#### Scenario: Implementation workflow is initialized
- **WHEN** a substantial implementation session is initialized for an active change
- **THEN** the repository SHALL persist the workflow mode, required roles, completed roles, waived roles, and change context in hook runtime state

#### Scenario: Session state is refreshed for a new conversation
- **WHEN** a new coding session starts in the repository
- **THEN** the repository SHALL create or reset the workflow state and SHALL expose the role rotation protocol in the session startup message

#### Scenario: Default Monopoly workflow requires a second UI and UX checkpoint
- **WHEN** a substantial Monopoly workflow session is initialized in planning, implementation, or release mode
- **THEN** the required role roster SHALL include a second UI and UX review role backed by the local `ui-ux-pro-max` workflow asset

### Requirement: Code edits are blocked until upstream roles are completed or waived
The system MUST deny repository-modifying actions until the required upstream roles for the current workflow mode are completed or explicitly waived with a recorded reason.

#### Scenario: Product, UX, architecture, or implementation gate is missing
- **WHEN** the coding agent attempts to modify repository files before the required pre-edit roles are completed or waived
- **THEN** the repository hook SHALL reject the action and SHALL report which roles are still missing

#### Scenario: Required upstream roles are satisfied
- **WHEN** the required pre-edit roles are completed or waived for the current workflow mode
- **THEN** repository-modifying actions SHALL be allowed to proceed

### Requirement: Commits and pushes require QA and playtest readiness evidence
The system MUST block commit- and push-like actions until the current workflow state records all required pre-commit roles, including QA and any required simulated-player gate, unless those roles were explicitly waived.

#### Scenario: QA gate is missing before commit
- **WHEN** the coding agent attempts a commit or push while required QA or playtest roles are still missing
- **THEN** the repository hook SHALL reject the action and SHALL report the missing roles

#### Scenario: Waived role is recorded with a reason
- **WHEN** a required role is waived with a repository-recorded reason
- **THEN** the workflow gate SHALL treat that role as satisfied for later checkpoints while preserving the waiver record

### Requirement: Release-ready actions require the full release roster
The system MUST require all release-mode roles, including release communication review, before release-like commands are treated as workflow-ready.

#### Scenario: Release marketer gate is missing
- **WHEN** a release-like command is attempted without a recorded release-marketer completion or waiver in release mode
- **THEN** the repository hook SHALL reject the action and SHALL report the missing release gate

#### Scenario: Release mode is fully satisfied
- **WHEN** every required release role is completed or waived in repository state
- **THEN** release-like actions SHALL pass the workflow gate while still respecting CI-first release policy
