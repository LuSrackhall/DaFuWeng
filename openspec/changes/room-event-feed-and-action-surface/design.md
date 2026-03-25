## Context

The room page already contains the right information, but the information hierarchy is still too noisy for active multiplayer play.

Three surfaces overlap today:

1. the overview card mixes room identity with active-stage summary
2. stage cards still repeat parts of the top-priority action story
3. the primary action anchor is directive, but the rest of the rail still competes with it

At the same time, recent events remain trapped inside the diagnostics drawer, even though they are useful for reconnect, spectator understanding, and multi-step stage comprehension.

## Goals / Non-Goals

**Goals**

- make the primary action anchor the only directive surface for the next must-do action
- reduce duplication between the overview card, stage cards, and the anchor
- introduce a formal recent-event feed that is visible in normal play without opening diagnostics
- add lightweight local settings for event-feed display order, near-event placement, numbering direction, and visible count
- improve auction input clarity without changing auction rules
- keep the change frontend-only

**Non-Goals**

- no room protocol, backend, or persistence changes
- no new event types, no server-side event history paging, and no new replay API
- no redesign of Pixi board rendering or event-stream semantics
- no cross-device or account-level synchronization for event-feed settings in this slice
- no full rewrite of every stage card copy outside the hierarchy cleanup needed here

## Decisions

### 1. Separate room-surface responsibilities explicitly

The room rail will use a strict split:

- overview card: room identity, seat/roster, and low-frequency room facts
- stage card: stage context and why the room is paused or focused here
- primary action anchor: who acts now, what must be done, and the immediate consequence

Why:

- players should not have to re-learn which surface is authoritative for the next action

### 2. Promote recent events into a player-facing event feed

The recent-event feed will leave the diagnostics drawer and become a formal room surface.

The diagnostics drawer can still keep technical room state, snapshot metadata, and raw recent events, but the player-facing event feed becomes the normal reading path.

Why:

- recent events help reconnecting and waiting players understand the room, but they currently require opening a technical drawer

### 3. Keep event-feed settings local and bounded

Event-feed settings will stay local to the client and only affect presentation.

Settings in this slice:

- ordering direction: newer-to-older or older-to-newer
- near-event placement: near events appear at the top or bottom of the feed
- numbering direction: near events use smaller or larger display numbers
- visible count: all, default 8, or a custom numeric limit

The client will clamp custom counts to a bounded range so the feed cannot grow into an unbounded long-session list.

Why:

- this preserves authoritative room truth while still supporting player reading preference

### 4. Distinguish player-facing numbering from technical event sequence

The recent-event feed will use display numbering for reading order and may show the real event sequence only as secondary metadata when needed.

Why:

- the backend sequence is a technical ordering anchor, not the player-facing step number for room narrative

### 5. Treat auction input as a bidding control, not a raw text box

The auction section in the primary action anchor will keep quick-bid buttons and the input box, but the input experience will be reshaped around:

- the current minimum valid bid
- immediate invalid-input feedback
- clear read-only messaging for non-acting viewers or passed bidders

Why:

- the current validation exists, but the interaction still feels like a generic form field instead of a focused room-stage control

## Data Flow

1. `projection.recentEvents` remains the authoritative source for the recent-event feed.
2. A new frontend helper derives event-feed items and settings-aware ordering from `projection.recentEvents`.
3. A new frontend helper derives the high-level action-surface model from projection state and current viewer identity.
4. `GamePage` consumes both helpers and maps them into cards, the event feed, and settings UI.
5. No new network or backend calls are introduced.

## UI Structure

### Board Area

- board hero remains lightweight
- the board stays readable first
- a formal event-feed panel is rendered in or near the board stage region so it is visible without entering diagnostics

### Room Rail

- primary action anchor stays at the top and remains directive
- overview card becomes identity-first and no longer repeats active-stage explanation
- stage cards stay detailed but no longer duplicate the anchor's primary CTA or primary minimum-bid instruction
- diagnostics drawer stays available for technical room state

### Event Feed

- default visible count is 8
- default reading mode uses newer events nearer the bottom
- default display numbering gives the nearest event the smallest number
- settings update the feed immediately without refresh

## Validation Strategy

**Unit / Vitest**

- action-surface model derivation
- event-feed ordering and truncation
- event-feed settings parsing, clamping, and defaults
- auction bid interaction helper behavior

**Playwright**

- room surface hierarchy and no duplicate top-priority controls in auction state
- recent-event feed default count and ordering
- event-feed settings change the visible order/count immediately and survive reload if persisted locally
- auction input experience remains clear and valid in a room flow

## Risks / Trade-offs

- [The event feed could visually compete with the board] -> keep it compact, bounded, and subordinate to the primary action anchor.
- ["All" could imply an unbounded event history] -> define "all" as all events currently retained by the client, not a new server-history mode.
- [Too many settings could bloat the room page] -> keep them inside a lightweight local settings panel attached to the event feed.
- [Numbering direction could confuse players] -> label display numbering clearly and keep technical sequence secondary.

## Migration Plan

1. Add OpenSpec artifacts for room-event-feed-and-action-surface.
2. Introduce helper models for action-surface hierarchy and event-feed display.
3. Rework the room overview card, stage cards, and anchor to remove duplicated guidance.
4. Promote recent events into a formal event-feed panel and keep diagnostics technical.
5. Add settings UI and bounded local persistence.
6. Add Vitest and Playwright coverage.