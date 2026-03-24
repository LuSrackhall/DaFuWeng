# Purpose

Make local clean e2e validation reproducible without temporary external Playwright configs.

# Requirements

### Requirement: Playwright supports environment-driven local validation profiles
The system SHALL allow the existing local Playwright lane to run against alternate frontend and backend execution settings through environment-driven configuration.

#### Scenario: A local isolated validation run uses alternate ports
- **WHEN** a local e2e run specifies alternate frontend and backend execution settings
- **THEN** the frontend preview, backend health check, Playwright base URL, and frontend API base URL SHALL all target the same isolated environment

### Requirement: The frontend package exposes a formal clean local e2e lane
The system SHALL provide a formal package script for isolated local clean e2e validation.

#### Scenario: A developer wants to run a clean local e2e pass
- **WHEN** a developer uses the formal clean local e2e script
- **THEN** the run SHALL disable existing server reuse and isolate its PocketBase data path from the default local lane