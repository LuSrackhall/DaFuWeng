# Purpose

Clarify the final trade review step on the room page.

# Requirements

### Requirement: The final trade step acts as a review card
The system SHALL present the final step of the normal-turn trade composer as a dedicated review card before a proposal is submitted.

#### Scenario: Player reviews a non-empty draft
- **WHEN** the acting player reaches the final step with a non-empty trade draft
- **THEN** the room page SHALL show grouped exchange details for both sides, a readable net cash-flow summary, and a clear reminder that the player can return to edit without losing the draft

#### Scenario: Player tries to review an empty draft
- **WHEN** the acting player has not added any cash, property, or card to either side of the trade draft
- **THEN** the room page SHALL block entry into the final review step and explain that there is no trade content to confirm yet