# Purpose

Clarify the high-risk final confirmation surface for normal-turn trade drafting.

# Requirements

### Requirement: The final trade confirmation surface highlights risk and consequence
The system SHALL present the final normal-turn trade confirmation step as a consequence-oriented review surface before a proposal is sent.

#### Scenario: Player reviews a risky trade draft
- **WHEN** the acting player reaches the final confirmation step with traded properties, cards, or cash
- **THEN** the room page SHALL show the traded asset state details, post-trade cash landing points, and the main consequences of sending the offer

#### Scenario: Player returns to edit the draft
- **WHEN** the acting player returns from the final confirmation surface back to the earlier trade steps
- **THEN** the room page SHALL preserve the current draft selections so the player can continue editing without rebuilding the proposal
