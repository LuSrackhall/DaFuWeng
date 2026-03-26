# Proposal

## Why

Real Playwright screenshots and image review now show two concrete UI risks in the current room experience:

- desktop active and property-decision states still create multi-focus competition between the board center cue, the floating event feed, and the right-side action rail
- mobile spectator states still place too much passive rail content ahead of the board, which makes the room harder to understand at a glance

These are not rule or backend problems. They are presentation-order and visual-priority problems inside the existing room shell.

## What Changes

- Add a small readability pass for the room surface.
- Reduce event-feed visual dominance during desktop primary-action states.
- Reorder mobile spectator layout so board context appears earlier.
- Lower duplicate or secondary rail information during spectator mobile review.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `web-game-client`: The room surface will better prioritize current action and board context across desktop and mobile spectator views.

## Impact

- Affected code: room layout, event feed presentation, responsive ordering, and screenshot review coverage.
- APIs and persistence: no backend or protocol changes.
- Systems: room readability, human scan cost, spectator comprehension, and screenshot-review quality evidence.

## Scope

### In Scope

- desktop active-turn readability tuning
- desktop property-decision readability tuning
- mobile spectator ordering and density tuning
- screenshot revalidation after the UI pass

### Out Of Scope

- no new gameplay states or rule changes
- no redesign of the full room shell
- no auction, trade, jail, or bankruptcy-specific UI redesign in this slice
- no event-feed feature rewrite

## Acceptance Summary

This slice is successful only if:

- desktop primary-action screens no longer feel like three equal focal blocks competing at once
- mobile spectator screenshots surface board context earlier and reduce side-rail overload
- screenshot review after the pass shows a clearer human reading path on both desktop and mobile