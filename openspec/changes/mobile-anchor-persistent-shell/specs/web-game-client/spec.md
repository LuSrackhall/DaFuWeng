# Purpose

Clarify that mobile room pages keep the primary action anchor continuously visible.

# Requirements

### Requirement: Mobile room pages keep the primary action anchor visible
The system SHALL keep the primary action anchor visible on narrow screens while the player scrolls through the room page.

#### Scenario: Player scrolls a mobile room page
- **WHEN** the room page is rendered on a narrow screen and the player scrolls through the board or support sections
- **THEN** the primary action anchor SHALL remain visible as a persistent mobile decision tray

#### Scenario: Player reaches the bottom of a mobile room page
- **WHEN** the room page is rendered on a narrow screen with a persistent action tray
- **THEN** the page layout SHALL reserve enough bottom space that the final interactive room content is not hidden behind the tray