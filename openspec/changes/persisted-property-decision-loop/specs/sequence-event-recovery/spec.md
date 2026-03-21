## ADDED Requirements

### Requirement: Clients can request room events after a known sequence
The system SHALL provide an ordered room event catch-up read path keyed by the client's latest applied sequence.

#### Scenario: Client is one or more events behind
- **WHEN** a client requests room events with `afterSequence` lower than the room's latest sequence
- **THEN** the backend SHALL return ordered room events after that sequence, or an authoritative snapshot fallback when incremental recovery is unsafe

### Requirement: Clients recover safely from sequence gaps
The system MUST avoid applying partial or incompatible event sequences to stale projections.

#### Scenario: Client sequence is too stale for incremental recovery
- **WHEN** the backend determines the client's last known sequence cannot be reconciled safely through incremental events alone
- **THEN** the response SHALL include an authoritative snapshot fallback and the client SHALL replace local projection state