## ADDED Requirements

### Requirement: Room persistence survives service restart
The system SHALL persist committed room snapshots, room events, and processed command records in a restart-safe collection-style store.

#### Scenario: Service restarts after a property purchase
- **WHEN** the backend restarts after a room has committed a property decision
- **THEN** reloading the room SHALL restore ownership, cash, pending action state, snapshot version, and event sequence from persisted records

### Requirement: Property ownership changes are persisted atomically with room state
The system MUST persist ownership and room progression changes together for accepted property decisions.

#### Scenario: Player buys the landed property
- **WHEN** a valid `purchase-property` command is committed
- **THEN** the persisted room snapshot and the persisted room event sequence SHALL both reflect the committed ownership and cash update
