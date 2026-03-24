## Context

The reconnect success strip already carries a useful recovery narrative, but it still becomes generic once the room pauses on auctions, trade responses, or jail decisions.

The automated suite also still lacks proof that a later reconnect replaces earlier reconnect context instead of leaking stale decision text.

## Goals / Non-Goals

**Goals:**
- Extend reconnect success narration to auctions, trade responses, and jail decisions.
- Add one repeated-disconnect regression that proves latest context wins.
- Preserve the existing lightweight success-strip behavior.

**Non-Goals:**
- No backend reconnect changes.
- No new room commands or rule changes.
- No multi-step timeline replay UI.

## Decisions

### 1. Decision-heavy reconnect narration remains snapshot-driven

Use existing projected summaries for auction, trade response, and jail decision instead of reconstructing history from recent events.

Why:
- These summaries already encode the current authoritative decision state and are more reliable than replaying event chains.

### 2. Reconnect narration should describe the current decider and stakes

Each new branch should answer both “what was just recovered” and “who must decide what now”.

Why:
- These phases are high-pressure moments where generic success copy leaves users uncertain.

### 3. Repeated reconnect must replace old narrative context

The repeated-disconnect regression should prove the second success strip reflects the latest recovered phase and does not keep stale phrasing from the first recovery.

Why:
- Repeated reconnects are where stale UI state is most likely to surface.

## Risks / Trade-offs

- [Narrative text may become longer in decision-heavy states] -> Acceptable because the strip remains short-lived and directly tied to a current decision.
- [More reconnect regressions increase suite time] -> Acceptable because reconnect remains a release-critical recovery path.

## Migration Plan

1. Add OpenSpec artifacts for auction/trade/jail reconnect narration and repeated disconnect.
2. Extend reconnect narrative generation to use auction, trade, and jail decision summaries.
3. Add Playwright regressions for the three new phases and repeated reconnect replacement.
4. Verify lint and e2e remain green.