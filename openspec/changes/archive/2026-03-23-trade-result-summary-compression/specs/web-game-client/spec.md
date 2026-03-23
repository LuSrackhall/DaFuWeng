# Purpose

Clarify how dense trade result cards should stay readable.

# Requirements

### Requirement: Trade result cards prioritize concise summaries over empty categories
The system SHALL present accepted and rejected trade result cards with concise summaries that remove empty category noise.

#### Scenario: Accepted trade result contains sparse exchanges
- **WHEN** an accepted trade result has only a subset of cash, property, or card changes
- **THEN** the room page SHALL omit empty categories from the result detail and SHALL lead with a concise bilateral summary before the detailed lines

#### Scenario: Rejected trade result contains sparse exchanges
- **WHEN** a rejected trade result has only a subset of cash, property, or card content
- **THEN** the room page SHALL omit empty categories from the rejected summary and SHALL still make clear what the proposer was offering or requesting