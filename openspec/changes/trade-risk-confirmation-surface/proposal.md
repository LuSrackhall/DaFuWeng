## Why

The trade review card now summarizes the draft clearly, but it still reads more like a tidy checklist than a high-risk confirmation surface. Players can see what changes hands, but they still need to infer key risks such as mortgaged assets, control changes, and what happens to the room once the offer is sent.

That keeps the flow understandable, but not yet strong enough for a high-stakes multiplayer confirmation moment.

## What Changes

- Strengthen the trade review card into a higher-risk confirmation surface.
- Add visible risk tags for traded assets and clearer consequence hints.
- Show post-trade cash landing points alongside the existing net cash summary.
- Explicitly verify through browser coverage that returning to edit preserves the draft.

## Capabilities

### New Capabilities
- None.

### Modified Capabilities
- `web-game-client`: The final normal-turn trade confirmation surface now highlights risk and consequence information more explicitly.

## Impact

- Affected code: frontend trade review surface, room-page styles, and frontend end-to-end coverage.
- APIs and persistence: no backend protocol or storage changes are required.
- Systems: final confirmation step for normal-turn optional trade drafting on the web room page.