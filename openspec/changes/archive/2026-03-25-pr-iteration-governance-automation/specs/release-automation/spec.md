# Purpose

Expand CI-first governance so pull requests carry stable slice-level delivery evidence.

# Requirements

### Requirement: Pull requests use stable iteration governance sections
The system SHALL provide a stable pull request structure for reporting the completed slice, quality evidence, remaining risks, and next-step recommendations.

#### Scenario: An author opens a pull request
- **WHEN** a contributor creates or edits a pull request
- **THEN** the repository SHALL provide a template containing stable sections for the completed slice, quality evidence, remaining risks, and next-step recommendations

### Requirement: CI validates PR iteration governance sections
The system SHALL validate required PR governance sections during pull_request CI runs.

#### Scenario: A pull_request CI run starts
- **WHEN** the main ci workflow evaluates a pull request
- **THEN** it SHALL verify that the PR body contains the required governance sections with non-placeholder content