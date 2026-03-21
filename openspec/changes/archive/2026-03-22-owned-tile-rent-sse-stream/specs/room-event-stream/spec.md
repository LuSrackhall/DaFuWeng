## ADDED Requirements

### Requirement: Active room viewers can subscribe to authoritative room events
The system SHALL expose a thin SSE endpoint for live room event delivery.

#### Scenario: Viewer subscribes with a recent sequence
- **WHEN** a client opens a room event stream with a safe `afterSequence`
- **THEN** the backend SHALL deliver ordered room events after that sequence and continue streaming newly committed events

#### Scenario: Viewer subscribes too far behind
- **WHEN** the backend determines the subscriber cannot safely recover through incremental events alone
- **THEN** the stream SHALL emit an authoritative snapshot fallback before continuing live delivery
