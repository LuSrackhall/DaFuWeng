## Why

The stepwise trade composer fixed sequencing, but the final review step is still too thin. Players can reach the last step without a strong final read on who gives what, how cash flows net out, and whether returning to edit will preserve the draft.

That makes the trade flow clearer, but not yet trustworthy enough at the final confirmation moment.

## What Changes

- Upgrade the last step of the normal-turn trade composer into a dedicated trade review card.
- Show grouped exchange details for both sides plus a readable net cash-flow summary.
- Block empty drafts before the player can enter the review step.
- Clarify that returning to edit the draft will preserve current selections.
- Extend browser coverage with a scenario that validates the review card and the empty-draft gate.

## Capabilities

### New Capabilities
- None.

### Modified Capabilities
- `web-game-client`: The normal-turn trade composer now ends with a stronger review card and earlier empty-draft validation.

## Impact

- Affected code: frontend trade composer review step, room-page styles, and frontend end-to-end coverage.
- APIs and persistence: no backend protocol or storage changes are required.
- Systems: normal-turn optional trade drafting on the web room page.