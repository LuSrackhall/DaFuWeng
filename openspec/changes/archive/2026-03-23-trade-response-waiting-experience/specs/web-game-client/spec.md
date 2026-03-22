# Purpose

Clarify the waiting experience while a trade response is outstanding.

# Requirements

### Requirement: The pending trade stage adapts to the viewer's role
The system SHALL present the pending trade stage with role-specific guidance while the room is waiting on a trade response.

#### Scenario: Proposer waits on a response
- **WHEN** the room is waiting on the counterparty to answer a pending trade and the current viewer is the proposer
- **THEN** the room page SHALL emphasize that the offer has already been sent, that the proposer is now waiting, and what room outcome follows acceptance or rejection

#### Scenario: Counterparty reviews the pending trade
- **WHEN** the room is waiting on the counterparty to answer a pending trade and the current viewer is that counterparty
- **THEN** the room page SHALL emphasize that it is their turn to decide and SHALL present the response consequences before the accept or reject controls

#### Scenario: Read-only viewer sees the pending trade
- **WHEN** the room is waiting on a pending trade response and the current viewer is neither proposer nor counterparty
- **THEN** the room page SHALL make clear that the room is paused on a trade response and that the current viewer can only observe
