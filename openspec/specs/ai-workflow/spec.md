# Purpose

Clarify final reply handoff requirements for repository AI workflow.

# Requirements

### Requirement: Final replies end with Closing Guidance
The repository AI workflow SHALL require every final reply to end with a Closing Guidance block as the absolute last section.

#### Scenario: Agent finishes a task
- **WHEN** the agent sends a final reply
- **THEN** the reply SHALL end with a Closing Guidance block and no content may appear after it

### Requirement: Closing Guidance is singular and absolute
The repository AI workflow SHALL require Closing Guidance to contain one concrete next prompt and one absolute new-conversation recommendation.

#### Scenario: Agent recommends the next step
- **WHEN** the agent emits the Closing Guidance block
- **THEN** it SHALL contain exactly one next-best prompt and exactly one non-hedged new-conversation recommendation in fixed order

#### Scenario: Agent decides whether a new conversation is required
- **WHEN** the agent chooses the `New conversation:` value
- **THEN** it SHALL use `必须另起新会话` only for a new isolated workflow, a new active OpenSpec change, a materially different task scope, or a cleaner context boundary; otherwise it SHALL use `不必另起新会话`
