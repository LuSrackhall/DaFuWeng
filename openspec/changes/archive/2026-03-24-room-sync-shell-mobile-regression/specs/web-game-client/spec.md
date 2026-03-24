# Purpose

Clarify how the room page presents in-page synchronization while route loading has already finished.

# Requirements

### Requirement: In-page room sync uses a dedicated sync shell
The system SHALL present incomplete room synchronization through a dedicated in-page sync shell instead of loose subtitle text.

#### Scenario: Room route has loaded but room state is still synchronizing
- **WHEN** the room page has mounted and room synchronization is still loading, falling back, or recovering
- **THEN** the page SHALL show a dedicated room sync shell with deterministic sync context

### Requirement: Mobile room sync shell stays prioritized
The system SHALL keep the in-page room sync shell visually prioritized on mobile while synchronization is incomplete.

#### Scenario: Mobile user enters a room while data is still loading
- **WHEN** the room page is rendered on a narrow screen and room data is still synchronizing
- **THEN** the in-page room sync shell SHALL appear before deeper room content and remain readable without horizontal overflow