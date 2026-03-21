# Tasks

## 1. OpenSpec And Workflow Definition

- [x] 1.1 Add proposal, design, tasks, and delta specs for enforced multi-agent delivery.
- [x] 1.2 Define workflow modes, required role sets, and waiver expectations for edit, commit, and release gates.

## 2. Hook Runtime State

- [x] 2.1 Add a shared workflow state helper for reading, writing, and validating role rotation state.
- [x] 2.2 Add a CLI script for initializing workflow mode, completing roles, waiving roles, resetting state, and printing missing gates.
- [x] 2.3 Exclude runtime workflow state from version control.

## 3. Hook Enforcement

- [x] 3.1 Update session start to create a fresh workflow state and inject the role rotation protocol into the system message.
- [x] 3.2 Update the pre-tool policy to block edits, commits, pushes, and release-like commands when required roles are incomplete or unwaived.
- [x] 3.3 Preserve existing destructive-command and CI-first protections while layering workflow gates on top.

## 4. Agent And Skill Alignment

- [x] 4.1 Update the workflow expert and tech lead agents so they act as entrypoints for initializing or advancing workflow state.
- [x] 4.2 Update the multi-agent delivery skill to require state updates after every role handoff.
- [x] 4.3 Update the playtest gate skill so release readiness can be recorded into the workflow state.
- [x] 4.4 Update repository-wide instructions to describe the new mandatory protocol for substantial work.
- [x] 4.5 Add Monopoly rules, Pixi scene, and versioning specialist roles plus a reusable default workflow prompt.

## 5. Verification

- [x] 5.1 Validate the helper CLI with representative modes and waiver paths.
- [x] 5.2 Validate the policy hook decisions for blocked edit, commit, and release attempts when gates are missing.
- [x] 5.3 Validate the happy path after role completion and waiver records are present.
- [x] 5.4 Add automated tests for workflow state and pre-tool policy behavior, and wire them into CI.