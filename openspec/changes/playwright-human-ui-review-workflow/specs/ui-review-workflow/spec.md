# Purpose

Define the repository workflow requirements for deterministic Playwright screenshot evidence and human-centered UI review for substantial player-visible frontend changes.

# Requirements

## Requirement: The repository provides a dedicated screenshot evidence lane for player-visible frontend work

The system SHALL provide a dedicated Playwright screenshot evidence workflow for substantial player-visible frontend changes.

### Scenario: A frontend-heavy round needs UI evidence

- **WHEN** a substantial frontend or interaction round changes player-visible room or lobby surfaces
- **THEN** the repository SHALL provide a dedicated screenshot evidence lane instead of relying only on business-flow end-to-end tests

## Requirement: Screenshot evidence remains separate from business E2E regression

The system SHALL keep screenshot evidence separate from business-flow end-to-end coverage so visual evidence does not replace functional regression proof.

### Scenario: A reviewer runs frontend regression evidence

- **WHEN** screenshot evidence is generated for a frontend-heavy round
- **THEN** the repository SHALL treat that evidence as a separate quality layer rather than as a replacement for deterministic tests or player-journey Playwright coverage

## Requirement: The first screenshot matrix covers desktop and mobile room evidence

The system SHALL generate a small deterministic screenshot matrix that covers both desktop and mobile room review.

### Scenario: The screenshot evidence lane runs successfully

- **WHEN** the dedicated screenshot review script completes
- **THEN** it SHALL emit at least one desktop player screenshot, one desktop decision-state screenshot, and one mobile in-game screenshot into a stable review folder

## Requirement: Screenshot evidence is reviewed with a human-centered checklist

The system SHALL review generated screenshots against a checklist focused on human comprehension and action clarity.

### Scenario: A reviewer inspects a generated screenshot

- **WHEN** a generated screenshot is reviewed
- **THEN** the reviewer SHALL judge whether the acting player, main CTA, visible hierarchy, crowding risk, and mobile readability are understandable for a normal human player