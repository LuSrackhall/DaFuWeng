## Why

The current room board already explains authoritative dice results, safe movement, landing consequences, and turn handoff through a 2D Pixi stage. That baseline is readable and trustworthy, but it still presents the main emotional loop of Monopoly too abruptly.

The main problems are:

- rolling dice still feels closer to a UI command than a premium board-game moment
- token movement is readable, but it does not yet create a strong sense of physical table presence
- spectators and waiting players still lose some drama during other players' turns because the board remains presentation-light
- the project has no formal strategy for higher-fidelity board presentation on strong devices while preserving a stable low-end fallback

This slice should define a 3D-capable board presentation path without changing rules, backend authority, or multiplayer fairness.

## What Changes

- Introduce a new presentation-focused change for a cinematic 3D board, 3D dice reveal, and 3D token movement.
- Define a dual-renderer direction where the existing Pixi board remains the stable baseline and fallback path.
- Add user-controlled presentation settings and device-aware performance tiers so 3D remains optional and bounded.
- Clarify that 3D presentation is a replay layer for confirmed authoritative results rather than a gameplay authority.
- Define validation and fallback expectations before implementation starts.

## Capabilities

### New Capabilities
- None.

### Modified Capabilities
- `web-game-client`: The room board will gain an optional cinematic presentation mode for authoritative roll reveal, token movement, and landing emphasis while keeping a stable non-3D fallback.

## Impact

- Affected code: frontend board presentation, board-scene adapter boundaries, local presentation settings, and validation assets.
- APIs and persistence: no backend protocol or PocketBase schema changes are part of this planning slice.
- Systems: room readability, turn spectacle, spectator comprehension, device capability fallback, and long-session render stability.

## Scope

### In Scope For The Planned Change
- a 3D-capable board presentation path for the room board
- 3D dice reveal that only plays after authoritative dice results are known
- 3D token movement when the authoritative path is provably safe
- concise landing and stage emphasis that remains subordinate to the room action surfaces
- local presentation preferences and performance grading that can disable or reduce 3D effects
- formal low-end and reduced-motion fallback expectations

### Explicitly Out Of Scope
- no gameplay rule changes
- no backend dice, movement, jail, card, or auction contract changes
- no protocol changes for rooms, reconnect, or event streams
- no fully interactive 3D board camera, free orbit, or drag-to-explore mode
- no 3D conversion of dense management flows such as trade composition, auction control, deficit recovery, or diagnostics
- no requirement that all devices run the same visual fidelity tier

## Product Boundaries

- 3D presentation is a result explainer, not a rules engine.
- The first release should focus on the most common and highest-value path: roll reveal, path movement, landing, and turn-stage handoff.
- Players who disable 3D or fall back to a lighter tier must still share the same room, same rules, same event order, and same action timing as players who keep 3D enabled.
- Spectators should gain better comprehension from the board stage, but they must remain fully read-only.

## Settings Strategy

- Presentation settings remain local to the device and must not affect room truth.
- The UX should expose presentation as a room-viewing choice rather than raw graphics jargon.
- The design should support a full off path plus reduced or lighter presentation tiers for constrained devices.
- User preference to reduce or disable presentation must override automatic enhancement.

## Risks

- [3D spectacle could weaken board readability] -> the change must keep board comprehension above cinematic flair.
- [Animation could be mistaken for rule authority] -> the design must explicitly bind all visible results to confirmed authoritative data.
- [Performance could regress on mobile or long sessions] -> the change must define hard fallback tiers, bounded effects, and manual performance gates.
- [The team could overreach into a full 3D game client] -> the change must stay narrow and presentation-first for its first implementation slices.

## Acceptance Summary

This change is ready to move from planning into later implementation only if the design clearly guarantees all of the following:

- low-end devices keep a stable fallback presentation path
- 3D dice and movement never invent or decide outcomes client-side
- ambiguous or non-standard movement paths downgrade safely instead of forcing misleading animation
- the room rail, primary action anchor, and accessibility summaries remain authoritative and non-blocking
- the technical route explains how Pixi and the new 3D layer coexist without collapsing current board stability