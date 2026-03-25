# Purpose

Define repository-wide documentation governance for Chinese-first README and official docs, plus per-round documentation update checks.

# Requirements

## Requirement: The repository defaults README and official docs to Chinese-first

The system SHALL define README and official documentation as Chinese-first by default, unless a specific workflow explicitly requires bilingual or external-facing variants.

### Scenario: The team writes long-lived project documentation

- **WHEN** README or official documentation is created or revised
- **THEN** the repository SHALL treat Chinese as the primary language by default

## Requirement: Each delivery round checks documentation update needs

The system SHALL require each delivery round to explicitly assess whether README and official documentation need updates.

### Scenario: A delivery slice changes long-lived project facts

- **WHEN** a slice changes project entry points, architecture facts, workflow rules, release behavior, or other long-lived user-facing facts
- **THEN** the workflow SHALL require an explicit decision on whether README or official docs must be updated in the same round