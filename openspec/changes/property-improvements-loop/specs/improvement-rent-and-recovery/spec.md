## ADDED Requirements

### Requirement: Improved rent is authoritative and deficit-safe
The system SHALL charge rent from the property's improvement level and enter deficit recovery if the payer cannot afford it.

#### Scenario: Player lands on an improved street
- **WHEN** a player lands on an owned street with one or more improvements
- **THEN** the backend SHALL charge rent from the configured rent ladder for that improvement level

#### Scenario: Player cannot afford improved rent
- **WHEN** improved rent exceeds the payer's available cash
- **THEN** the backend SHALL enter the authoritative deficit flow with the property owner as creditor