# Purpose

Extend release automation so published release context includes deterministic Chinese and English summary appendices derived from current release facts.

# Requirements

## Requirement: Release automation generates deterministic bilingual summaries

The system SHALL generate deterministic Chinese and English release summary appendices from semantic-release notes and engineering evidence without relying on external models.

### Scenario: Release summary is prepared

- **WHEN** the release workflow prepares local release summary artifacts
- **THEN** it SHALL generate a bilingual appendix using only the current release notes and engineering evidence

## Requirement: Published releases can include bilingual summary context

The system SHALL append bilingual summary context to release artifacts and published GitHub Release body content when the summary is available.

### Scenario: Release publication succeeds

- **WHEN** the release publication flow updates GitHub body content after publish
- **THEN** it SHALL append the bilingual summary appendix without altering semantic version inference or duplicating existing summary sections
