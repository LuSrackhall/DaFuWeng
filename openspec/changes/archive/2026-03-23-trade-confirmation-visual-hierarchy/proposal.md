## Why

The final trade confirmation surface already contains the right facts, but its visual hierarchy is still too flat. Players can miss the difference between a routine summary line, a meaningful warning, and an irreversible consequence because they are presented at nearly the same weight.

That means the confirmation step is informative, but not yet forceful enough for a high-stakes multiplayer decision.

## What Changes

- Reorder the final trade confirmation surface around clear hierarchy tiers.
- Put consequence-first information ahead of the bilateral exchange details.
- Separate irreversible consequences from ordinary risk hints.
- Extend browser coverage with assertions for the new confirmation-layer headings.

## Capabilities

### New Capabilities
- None.

### Modified Capabilities
- `web-game-client`: The final normal-turn trade confirmation surface now emphasizes its information hierarchy more clearly.

## Impact

- Affected code: frontend trade confirmation layout, room-page styles, and frontend end-to-end coverage.
- APIs and persistence: no backend protocol or storage changes are required.
- Systems: final confirmation step for normal-turn optional trade drafting on the web room page.
