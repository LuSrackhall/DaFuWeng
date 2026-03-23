# Purpose

Clarify result hierarchy and mobile tray behavior in room pages.

# Requirements

### Requirement: Formal room results use a single detailed result surface
The system SHALL keep the detailed explanation of a formal room result in the result card, while the primary action anchor returns to current responsibility.

#### Scenario: Formal result is visible in the room rail
- **WHEN** a formal room result such as a trade outcome or unsold auction is present
- **THEN** the result card SHALL carry the detailed explanation and the primary action anchor SHALL focus on the next current action

### Requirement: Unsold auctions read as contextual neutral results
The system SHALL present an unsold auction as a contextual neutral result instead of a generic success or warning outcome.

#### Scenario: Auction ends without transfer
- **WHEN** all remaining bidders pass and the auction closes without a winner
- **THEN** the room board and result card SHALL explain that the auction ended without transfer and ownership remains unsold

### Requirement: Mobile primary action trays are consequence-first
The system SHALL make the mobile primary action tray emphasize the result of the next decision before secondary guidance.

#### Scenario: Room page is viewed on mobile during an actionable state
- **WHEN** the room page is rendered on a narrow screen while a player can act
- **THEN** the primary action tray SHALL foreground the immediate consequence of that action and present a single dominant main action