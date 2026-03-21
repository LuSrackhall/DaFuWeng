## ADDED Requirements

### Requirement: Deficit players can mortgage owned property for recovery cash
The system MUST let a deficit player mortgage owned unmortgaged property.

#### Scenario: Mortgage resolves the deficit
- **WHEN** a valid mortgage raises enough cash to satisfy the pending payment
- **THEN** the backend SHALL settle the payment, mark the property as mortgaged, and resume normal room progression

#### Scenario: Mortgaged property is landed on later
- **WHEN** another player lands on a mortgaged property
- **THEN** the backend SHALL NOT charge rent for that tile
