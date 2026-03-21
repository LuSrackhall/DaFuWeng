# Purpose

Define versioned authoritative room snapshot persistence semantics.

# Requirements

### Requirement: Authoritative room snapshots are versioned
The system SHALL attach monotonically increasing room snapshot version metadata to each accepted room mutation.

#### Scenario: Backend accepts a gameplay mutation
- **WHEN** the backend commits a successful gameplay command for a room
- **THEN** the returned authoritative snapshot SHALL include a `snapshotVersion` greater than the room's previous committed snapshot

#### Scenario: Invalid command is rejected
- **WHEN** the backend rejects a gameplay command before mutation
- **THEN** the room snapshot version SHALL NOT advance

### Requirement: Authoritative room events are ordered per room
The system SHALL assign monotonically increasing room-local event sequence numbers to authoritative room events.

#### Scenario: Successful roll produces room events
- **WHEN** a valid `roll-dice` command resolves movement
- **THEN** the backend SHALL append ordered room events with increasing sequence numbers and expose the newest applied sequence in the authoritative snapshot

#### Scenario: Client refreshes with stale state
- **WHEN** a client reloads after missing one or more room events
- **THEN** the authoritative snapshot SHALL contain enough version and sequence metadata for the client to determine it is stale and replace local projection state

### Requirement: Mutating gameplay commands are idempotent
The system MUST prevent duplicate room mutations caused by retried gameplay commands.

#### Scenario: Same roll command is retried
- **WHEN** the same player resubmits the same `roll-dice` command for the same room with the same idempotency key
- **THEN** the backend SHALL return the previously committed authoritative result instead of applying a second mutation
