# Purpose

Define the web client requirements for an optional cinematic 3D board presentation that remains subordinate to authoritative gameplay state and preserves a stable non-3D fallback.

# Requirements

## Requirement: The web client keeps a stable 2D board fallback while adding cinematic 3D presentation

The system SHALL preserve a stable 2D board renderer while adding an optional cinematic 3D board presentation path.

### Scenario: A room opens on a device that does not use cinematic presentation

- **WHEN** the room page renders on a device or preference path that disables cinematic presentation
- **THEN** the system SHALL render the board through the existing stable 2D path without changing room semantics or action timing

### Scenario: A room opens on a device that can use cinematic presentation

- **WHEN** the room page renders on a device and preference path that permits cinematic presentation
- **THEN** the system SHALL select the cinematic 3D board renderer while preserving the same authoritative room truth and action surfaces

## Requirement: The cinematic 3D board uses a dedicated 3D renderer stack

The system SHALL implement the cinematic 3D board path with `three.js` through `react-three-fiber`, while keeping Pixi as the 2D baseline renderer.

### Scenario: The 3D board path is initialized

- **WHEN** the room page resolves into the cinematic 3D board mode
- **THEN** the system SHALL mount a `react-three-fiber` scene backed by `three.js` instead of attempting to turn the Pixi baseline renderer into pseudo-3D

### Scenario: The room must fall back to 2D

- **WHEN** the room page cannot safely keep the cinematic 3D path active
- **THEN** the system SHALL fall back to the stable Pixi 2D board path without changing room semantics or control ownership

## Requirement: Cinematic 3D presentation remains authority-safe

The system SHALL treat cinematic 3D board presentation as a replay layer for confirmed authoritative results rather than as a gameplay authority.

### Scenario: A dice result is not yet authoritative

- **WHEN** the client is still waiting for the authoritative dice result
- **THEN** the cinematic board SHALL NOT display a readable 3D dice face that could be interpreted as the final outcome

### Scenario: A dice result is authoritative

- **WHEN** an authoritative dice result reaches the board presentation layer
- **THEN** the cinematic board SHALL reveal that confirmed result without inventing or changing the outcome client-side

## Requirement: Cinematic 3D movement only animates on provably safe paths

The system SHALL animate 3D token movement stepwise only when the authoritative previous and next board states prove a single safe path.

### Scenario: A single safe forward movement is confirmed

- **WHEN** exactly one player position changes and the confirmed dice total maps to a single safe forward path that lands on the authoritative final tile
- **THEN** the cinematic board SHALL animate stepwise 3D token movement along that path

### Scenario: A movement path is ambiguous or non-standard

- **WHEN** the board cannot prove a single safe cinematic path because of reconnect, catch-up, card movement, jail transition, teleport, backward movement, or any other non-standard case
- **THEN** the cinematic board SHALL downgrade to a safe non-misleading presentation instead of animating a false path

## Requirement: Presentation grading and fallback remain local and non-blocking

The system SHALL keep cinematic presentation preferences, performance grading, and renderer fallback local to the client and subordinate to authoritative room semantics.

### Scenario: A player changes presentation preference

- **WHEN** a player changes local board presentation preferences such as immersive versus classic viewing or restrained motion
- **THEN** the system SHALL update local presentation behavior without changing authoritative room state for other players

### Scenario: Runtime conditions require a lower presentation tier

- **WHEN** reduced-motion preferences, device capability limits, or runtime performance distress require a downgrade
- **THEN** the system SHALL reduce or disable cinematic presentation without delaying room actions, recent events, or accessibility summaries

## Requirement: Cinematic board presentation remains subordinate to room actions and summaries

The system SHALL keep the room rail, primary action anchor, recent event feed, and semantic board summaries authoritative and readable while cinematic presentation is active.

### Scenario: Cinematic playback overlaps with a room decision surface

- **WHEN** the room advances into or remains inside a state with an actionable room control
- **THEN** the cinematic board SHALL NOT block or delay the authoritative action surface and room-stage explanation

### Scenario: Assistive or automated readers inspect the board during cinematic playback

- **WHEN** the board host summary is read during cinematic playback
- **THEN** it SHALL continue to expose authoritative room-facing summaries rather than only cinematic visual detail
