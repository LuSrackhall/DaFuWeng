# Purpose

Define a small readability pass for the room surface so primary actions and board context remain easier to understand for normal human players and spectators.

# Requirements

## Requirement: Desktop primary-action states reduce competing focal blocks

The system SHALL reduce competing focal blocks during desktop active-turn and property-decision states.

### Scenario: A desktop primary-action state is visible

- **WHEN** the room shows a high-attention desktop action state such as rolling or deciding whether to buy property
- **THEN** the event feed SHALL behave like supporting context rather than a co-equal focal panel

## Requirement: Mobile spectator layout surfaces board context earlier

The system SHALL surface board context earlier for mobile spectator views.

### Scenario: A spectator opens an in-game room on mobile

- **WHEN** the room is viewed as a spectator in the mobile tray layout
- **THEN** the board SHALL appear before the full room rail stack so the spectator can understand current action and board context sooner