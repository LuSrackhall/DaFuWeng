# Purpose

Clarify how trade result cards should behave on narrow mobile screens.

# Requirements

### Requirement: Mobile trade result cards remain readable without horizontal pressure
The system SHALL keep accepted and rejected trade result cards readable on narrow mobile screens.

#### Scenario: Accepted trade result is shown on mobile
- **WHEN** the room page renders an accepted trade result on a narrow mobile viewport
- **THEN** the result card SHALL present the settlement content in a single readable column without horizontal scrolling and SHALL keep the next-step guidance visible

#### Scenario: Rejected trade result is shown on mobile
- **WHEN** the room page renders a rejected trade result on a narrow mobile viewport
- **THEN** the result card SHALL present the recovery content in a single readable column without horizontal scrolling and SHALL keep the next-step guidance visible