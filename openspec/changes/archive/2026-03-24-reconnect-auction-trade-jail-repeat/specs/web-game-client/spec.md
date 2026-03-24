# Purpose

Clarify reconnect recovery narration for more decision-heavy phases and repeated reconnect replacement.

# Requirements

### Requirement: Reconnect success narrates auction recovery
The system SHALL explain auction context when reconnect success occurs during a live auction.

#### Scenario: Auction reconnect succeeds
- **WHEN** reconnect success feedback appears while the room has recovered into a live auction
- **THEN** the feedback SHALL explain the current auction stakes and who decides next

### Requirement: Reconnect success narrates trade response recovery
The system SHALL explain trade response context when reconnect success occurs during a pending trade response.

#### Scenario: Trade response reconnect succeeds
- **WHEN** reconnect success feedback appears while the room has recovered into trade response
- **THEN** the feedback SHALL explain the current trade responder and decision state

### Requirement: Reconnect success narrates jail decision recovery
The system SHALL explain jail decision context when reconnect success occurs during a jail decision.

#### Scenario: Jail decision reconnect succeeds
- **WHEN** reconnect success feedback appears while the room has recovered into jail decision
- **THEN** the feedback SHALL explain the current jail decision options and who decides next

### Requirement: Later reconnects replace earlier reconnect context
The system SHALL replace stale reconnect narration with the newest recovered context after repeated reconnects.

#### Scenario: A second reconnect reaches a new phase
- **WHEN** the client reconnects, recovers, disconnects again, and later recovers into a newer room phase
- **THEN** the next reconnect success feedback SHALL describe only the newest recovered phase and SHALL NOT reuse stale text from the earlier recovery