# Purpose

Clarify the reading order and visual hierarchy of the final trade confirmation surface.

# Requirements

### Requirement: The final trade confirmation surface prioritizes consequence-first reading
The system SHALL present the final normal-turn trade confirmation surface in a hierarchy that emphasizes consequences before detailed exchange review.

#### Scenario: Player reviews the final confirmation surface
- **WHEN** the acting player reaches the final normal-turn trade confirmation step
- **THEN** the room page SHALL emphasize the irreversible submission consequence and high-priority risk summary before the bilateral exchange detail list

#### Scenario: Player scans the exchange details after consequences
- **WHEN** the acting player continues reviewing the final confirmation surface
- **THEN** the room page SHALL still present the detailed "you give" and "you receive" breakdown in a clearly secondary review section
