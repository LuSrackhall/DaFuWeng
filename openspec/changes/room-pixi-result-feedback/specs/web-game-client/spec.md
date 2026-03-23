# Purpose

Clarify that the Pixi room board explains recent authoritative results.

# Requirements

### Requirement: The Pixi room board reflects recent authoritative results
The system SHALL surface recent authoritative results in the Pixi room board center HUD when a new outcome has just been resolved.

#### Scenario: Formal room result becomes the latest outcome
- **WHEN** the latest room projection includes a formal result such as a completed trade, bankruptcy settlement, or unsold auction
- **THEN** the Pixi room board SHALL surface that result title and consequence in its center HUD

#### Scenario: Room page recovers after refresh
- **WHEN** the room page refreshes after a recent authoritative result
- **THEN** the Pixi room board SHALL restore the same recent result feedback from the recovered room projection