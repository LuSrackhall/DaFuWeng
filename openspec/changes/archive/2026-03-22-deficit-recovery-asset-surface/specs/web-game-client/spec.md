# Purpose

Clarify room-page presentation for deficit recovery assets.

# Requirements

### Requirement: The room page presents a readable deficit recovery panel
The system SHALL present a recovery-oriented room stage when a player is resolving a forced payment deficit.

#### Scenario: Deficit recovery is active
- **WHEN** the room is waiting on the deficit player to mortgage assets or declare bankruptcy
- **THEN** the room page SHALL explain the debt, show who may act, present visible recovery assets with readable action consequences, and keep non-acting viewers in a clear read-only state
