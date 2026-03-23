## Context

The room page already contains the right information, but it still makes players search for the action that actually advances the room.

The current actor, the must-do action, and the immediate outcome preview are spread across several surfaces.

## Goals / Non-Goals

**Goals:**
- Fix a single primary action anchor at the top of the room rail.
- Keep the anchor stable across waiting room, normal turn, trade response, auction, and deficit recovery states.
- Separate the primary action from secondary tools and support detail.

**Non-Goals:**
- No rule, protocol, or authority changes.
- No full redesign of every stage card.
- No canvas interaction work.

## Decisions

### 1. Use one persistent action anchor card

The room rail should always begin with a dedicated primary action card.

Why:
- Players should not have to re-learn where the next step appears.

### 2. Let stage cards stay detailed while the anchor stays directive

The anchor answers who acts, what to do, and what happens next.
The stage card below can keep the detail-heavy explanation.

Why:
- This prevents duplicate control surfaces from competing for attention.

### 3. Keep secondary tools secondary

Trade drafting, development tools, assets, and diagnostics remain below the anchor.

Why:
- These are optional or supporting actions, not the main room progression action.

## Risks / Trade-offs

- [Some text will move from existing cards into the anchor] -> Acceptable because hierarchy clarity is the goal.
- [Auction and deficit still keep detailed controls below] -> Acceptable because those flows need more space than a compact anchor.

## Migration Plan

1. Add OpenSpec artifacts for the primary action anchor.
2. Introduce the anchor card in GamePage.
3. Remove duplicated top-priority buttons from waiting-room and trade-response cards.
4. Add Playwright assertions that the anchor remains visible in room flows.
