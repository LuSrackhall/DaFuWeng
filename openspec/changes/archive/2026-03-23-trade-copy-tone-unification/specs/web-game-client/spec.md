# Purpose

Clarify the tone expected from player-facing trade messaging.

# Requirements

### Requirement: Core trade-loop copy uses a player-facing tone
The system SHALL present the core trade loop with player-facing guidance rather than backend-style status language.

#### Scenario: Player reads a waiting or result trade state
- **WHEN** the room page presents a trade waiting state or a trade result card
- **THEN** the copy SHALL explain who acts, what changed or did not change, and what happens next without using backend-oriented terms such as authority, atomic, or process

#### Scenario: Player reviews a trade before submission
- **WHEN** the acting player reviews a trade entry or pre-submit confirmation surface
- **THEN** the copy SHALL describe the choice and consequence in direct player language rather than system-status language
