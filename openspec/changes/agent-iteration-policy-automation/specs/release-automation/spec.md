# Purpose

Expand CI-first automation to validate persistent repository-level agent delivery policy wiring.

# Requirements

### Requirement: CI validates persistent agent delivery policy wiring
The system SHALL validate persistent repository-level agent delivery policy wiring in GitHub Actions before release jobs are eligible to run.

#### Scenario: Validation workflow runs
- **WHEN** the main CI workflow evaluates a revision
- **THEN** it SHALL verify that the repository's persistent agent delivery policy source and required guidance targets remain synchronized

### Requirement: Local session-start messaging inherits the persistent policy summary
The system SHALL surface the persistent agent delivery policy summary during local session initialization.

#### Scenario: A local agent session starts
- **WHEN** the repository session-start hook runs
- **THEN** it SHALL include a concise summary of the persistent agent delivery policy in the emitted system message