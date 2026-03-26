# Review Notes

## Evidence

This change produced the following screenshot evidence through Playwright:

- `frontend/test-results/ui-review/room-active-turn-desktop.png`
- `frontend/test-results/ui-review/room-property-decision-desktop.png`
- `frontend/test-results/ui-review/room-mobile-spectator.png`

## First Human-Centered Review

### Desktop Active Turn

- Pass: the acting player, main stage, and primary dice CTA are understandable within a few seconds.
- Pass: the room rail explains the next action clearly and does not hide the main button.
- Concern: the event feed card floating over the lower board area creates an additional focal block and competes with the center board cue.
- Concern: the page currently asks the eye to scan header summary, board center result, floating event feed, and room rail in a relatively short horizontal window.

### Desktop Property Decision

- Pass: the property decision surface is clear, and the buy versus decline choice is easy to locate.
- Pass: the price and consequence copy are near the main CTA, which helps fast comprehension.
- Concern: the center board cue, floating event feed, and right decision rail form three simultaneous focal zones.
- Concern: the board itself becomes more decorative than explanatory once the decision rail and event feed both expand.

### Mobile Spectator View

- Pass: the user immediately understands that this is a read-only spectator state.
- Pass: the current actor and high-level action are still readable near the top of the screen.
- Concern: the board context falls too far below the dense room rail stack, so the visible board becomes secondary to the point of near-loss.
- Concern: the event feed starts low on the page and pushes the actual board farther down, increasing scan cost on a narrow screen.
- Concern: the mobile evidence suggests the current room stack is readable but not yet especially convenient for fast spectator understanding.

## Severity Summary

- Blocker: none in the first screenshot matrix.
- Major: mobile spectator hierarchy likely over-prioritizes rail content relative to board context.
- Medium: desktop room states accumulate too many concurrent focal blocks when event feed and board center cue are both prominent.
- Minor: top summary chips and room rail metadata are readable, but the overall information stack could still be calmer.