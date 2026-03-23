# Purpose

Clarify how trade result cards recover after a browser reload.

# Requirements

### Requirement: Trade result cards survive browser reload for joined players
The system SHALL recover accepted and rejected trade result cards after a joined player reloads the room page.

#### Scenario: Accepted trade result survives reload
- **WHEN** a joined player reloads the browser after a trade has been accepted and the result card is visible
- **THEN** the room page SHALL still show the accepted trade result and the resumed next-step room state

#### Scenario: Rejected trade result survives reload
- **WHEN** a joined player reloads the browser after a trade has been rejected and the result card is visible
- **THEN** the room page SHALL still show the rejected trade result and the resumed next-step room state