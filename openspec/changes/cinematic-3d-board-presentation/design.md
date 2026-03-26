## Context

The current board stack is already organized around a healthy authority boundary:

1. the backend owns dice, movement, and room truth
2. the projection layer turns authoritative snapshots and events into room-facing state
3. `GamePage` derives board-facing cues from that projection
4. `BoardScene` renders those cues and exposes semantic board summaries

The next step is not to replace this model, but to extend it with an optional cinematic presentation layer.

That extension must solve five problems at once:

1. improve the emotional payoff of roll -> move -> land without inventing gameplay
2. keep the current 2D Pixi board as a permanent safe path and low-end fallback
3. prevent 3D from becoming a source of authority confusion
4. allow low-end, reduced-motion, and thermally constrained devices to stay fully playable
5. avoid turning the current board stack into a tangled multi-engine state system

## Goals / Non-Goals

**Goals**

- define a presentation-only architecture for an optional 3D board mode
- keep authoritative game state, room protocol, and rule ownership unchanged
- preserve the existing 2D Pixi board as the baseline and fallback renderer
- add local presentation settings and capability-aware quality tiers
- define when 3D dice reveal and token movement may animate and when they must downgrade
- set explicit performance, accessibility, and validation boundaries before implementation begins

**Non-Goals**

- no backend or PocketBase schema changes
- no room-event protocol changes
- no new authoritative transition types in this planning slice
- no free camera, drag-and-zoom, or explorable 3D board control surface
- no migration of dense room management actions into 3D space
- no attempt to make 3D the only supported board renderer
- no promise that every supported device receives identical cinematic fidelity

## Decisions

### 1. Keep a strict single-source-of-truth chain

Authority remains unchanged:

- backend and projection layers own room truth
- `GamePage` owns semantic interpretation for presentation
- board renderers own only ephemeral visual state

The cinematic system must consume already interpreted scene cues rather than reverse-engineering raw recent events inside the renderer.

Why:

- this keeps rule logic out of rendering layers and preserves reconnect trust

### 2. Use a dual-renderer architecture instead of mutating Pixi into fake 3D

The planned route is:

- keep the existing 2D Pixi `BoardScene` as the stable baseline renderer
- add a presentation adapter above the board renderer boundary
- allow that adapter to choose between:
  - a stable 2D Pixi board path
  - an optional cinematic 3D board path

The 3D renderer should be treated as a peer presentation layer, not a rewrite of authoritative state ownership.

Why:

- this preserves the current proven board path while allowing a separate 3D implementation to mature without destabilizing the room shell

### 3. Prefer a React-first 3D route

The 3D path should use a React-compatible renderer strategy, with the current planning assumption being:

- React shell remains the room container
- DOM remains the decision and management surface
- Pixi remains the permanent 2D board renderer and fallback path
- the 3D board path may use a dedicated 3D scene stack such as `three.js` through a React-oriented integration layer

Why:

- the current room shell is already React-first, and the new 3D path should fit the existing state and layout model rather than fight it

### 4. Add a board presentation adapter layer

Before implementation deepens, the frontend should define a board presentation model that combines:

- authoritative board state
- interpreted scene cues
- local presentation settings
- resolved device capability tier
- runtime downgrade state

That adapter becomes the only component responsible for deciding whether the board uses:

- static presentation
- reduced presentation
- standard presentation
- enhanced presentation

Why:

- this separates gameplay truth from device policy and keeps BoardScene implementations thin

### 5. Keep settings local, versioned, and sanitized

Presentation settings must remain device-local and must not enter authoritative room state.

Suggested preference categories:

- presentation mode: classic or immersive
- performance preference: standard or restrained
- optional reduced-motion respect
- optional explicit cinematic disable switch

Rules for persistence:

- use a dedicated local storage key and version schema
- sanitize all stored values on read
- keep user choice higher priority than automatic enhancement
- do not persist temporary runtime downgrade as a permanent user preference

Why:

- presentation should adapt per device without fragmenting room truth or multiplayer semantics

### 6. Resolve fallback in a fixed order

The board must decide presentation in this order:

1. data trust fallback
2. semantic safety fallback
3. device capability fallback
4. user preference override

Definitions:

- data trust fallback: reconnect, catch-up, stale snapshot recovery, or any state where the UI is still restoring authoritative context
- semantic safety fallback: the renderer cannot prove a safe cinematic path even though data is authoritative
- device capability fallback: the device cannot sustain the intended tier without risking stability

Why:

- a powerful device should not force cinematic motion when the authoritative path is ambiguous

### 7. Make 3D dice result-driven only

3D dice reveal may exist only as a reveal of already confirmed authority.

Allowed behavior:

- brief unreadable pre-roll anticipation
- visible dice faces only after the authoritative result is known
- short result reveal tied to the confirmed dice label or total

Forbidden behavior:

- client-side dice physics deciding values
- readable dice faces before authority arrives
- any visual language that implies physics chose the result

Why:

- Monopoly trust depends on players understanding that the backend still owns the roll

### 8. Use a movement whitelist and downgrade blacklist

3D token movement may animate stepwise only when all of the following are true:

- exactly one player position changed
- the move came from a confirmed roll result
- the previous and next positions produce a single safe forward path
- the dice total matches that path exactly
- no reconnect or catch-up semantics are active

The renderer must downgrade to snap, short jump, or minimal emphasis when any of the following applies:

- reconnect or snapshot catch-up
- multiple players change position together
- teleport or card-driven movement
- jail entry or jail-only state transitions
- backward movement
- nearest-railway or nearest-utility style jumps
- any path that cannot be uniquely proven from authority

Why:

- incorrect motion is worse than no motion because it teaches the wrong rule model

### 9. Keep room controls and semantics non-blocking

The room rail, primary action anchor, diagnostics, recent event feed, and accessibility summaries must continue updating from authoritative state immediately.

3D presentation may never delay:

- the next valid action surface
- the room's current stage explanation
- spectator-readability cues
- board host semantic summaries

Why:

- cinematic presentation explains confirmed truth; it does not gate room understanding

### 10. Use bounded quality tiers

The design should explicitly support at least these tiers:

- `static`: no cinematic movement, safest presentation path
- `reduced`: limited emphasis, no heavy camera motion
- `standard`: normal cinematic cues with bounded effects
- `enhanced`: richer 3D emphasis on strong devices only

The first implementation phase should assume:

- mobile defaults never exceed `standard`
- reduced-motion environments do not enter `enhanced`
- runtime performance distress can automatically reduce the active tier

Why:

- a long-session board game needs sustainable rendering more than universal spectacle

## Data Flow

1. authoritative room snapshots and events continue feeding the projection layer
2. `GamePage` or a dedicated selector module derives the semantic board cue model
3. a new board presentation adapter combines:
   - semantic board cues
   - local presentation settings
   - resolved capability tier
   - runtime fallback status
4. the adapter selects the active board renderer and passes only presentation-safe props into it
5. the active renderer owns only ephemeral animation state and destroyable render resources

## UI And Experience Structure

### Room Shell

- the room shell keeps React + DOM ownership for primary actions, dense controls, recent events, and diagnostics
- 3D presentation never becomes the only place where a player can understand the next action

### Board Stage

- the board remains the main stage for roll reveal, token movement, landing emphasis, and turn handoff
- the board should feel like a premium tabletop stage rather than a free camera playground
- the center board cue remains concise and should not become a dense 3D HUD

### Settings

- settings should describe experience choices rather than raw graphics jargon
- presentation settings remain local and reversible
- reduced-motion and low-end device fallback must still preserve the same room semantics

## Performance Boundaries

The planned implementation must treat performance as a product boundary, not a later optimization.

Initial hard constraints:

- heavy effects must be tier-gated or switchable off
- idle board presentation must avoid unnecessary high-frequency redraw loops
- low-end devices must retain a first-class baseline path rather than a broken degraded mode
- runtime performance distress must trigger automatic reduction rather than continuing to push the highest tier

Effects that must be reducible or disabled in early implementation:

- heavy camera motion
- dynamic lighting or expensive post-processing
- persistent particle systems
- non-essential environment animation
- any effect that competes with board readability

## Validation Strategy

### Unit

- capability tier resolution
- settings sanitize and version migration
- cinematic plan derivation
- animation whitelist and downgrade blacklist logic
- cue dedupe, interrupt, and reconnect suppression behavior

### Integration

- projection-to-presentation adapter behavior
- fallback ordering across reconnect, catch-up, ambiguous movement, and constrained devices
- local settings interaction with capability tiers
- non-blocking room-shell updates while cinematic cues are active

### Playwright

- settings persistence and downgrade behavior remain user-visible and stable
- authoritative controls and semantic room copy remain readable during cinematic playback
- reconnect or refresh does not replay stale cinematic cues
- mobile layouts remain readable with reduced or disabled presentation paths

### Manual Performance And UX Verification

- desktop and mobile device tiers
- long-session stability
- reconnect and background/foreground recovery
- perceived readability of roll, movement, landing, and handoff stages
- thermal and frame stability under repeated turn progression

### Coverage Warning

Current automated coverage is strong for projection semantics and room-shell contracts, but it is still lagging for cinematic scene quality, visual timing comfort, and device-specific performance behavior. This change must therefore treat manual performance and UX review as a formal gate rather than optional polish.

## Risks / Trade-offs

- [Dual renderer complexity increases maintenance cost] -> acceptable if the adapter boundary stays strict and 2D remains the stable baseline.
- [3D could overshadow decision surfaces] -> acceptable only if DOM action surfaces remain authoritative and non-blocking.
- [A strong device matrix could still reveal unstable tiers] -> acceptable if enhanced fidelity is optional and can auto-downgrade safely.
- [The team may be tempted to expand into full free-camera 3D] -> acceptable only if the first implementation slice remains presentation-first and result-driven.

## Migration Plan

1. Create OpenSpec planning artifacts for cinematic-3d-board-presentation.
2. Define the board presentation adapter boundary and settings model.
3. Define quality tiers, fallback ordering, and downgrade rules.
4. Implement a low-risk baseline 3D path only after unit and integration seams are in place.
5. Validate reconnect, reduced-motion, low-end, and long-session behavior before broadening cinematic scope.
6. Expand fidelity only after the baseline 2D fallback remains stable and testable.