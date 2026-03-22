## Context

The backend already supports authoritative mortgage-based deficit recovery and bankruptcy exit. The frontend also explains who owes whom and why the room is paused. What is still missing is a real recovery surface.

Right now the acting player sees a strip of mortgage buttons detached from the debt explanation. Observers can understand that a crisis exists, but not what the debtor can still do. This slice fixes that product gap without changing the underlying rules.

## Goals / Non-Goals

**Goals:**
- Merge debt explanation and recovery actions into a single readable deficit recovery surface.
- Show mortgage value and remaining shortfall impact for each mortgageable property.
- Keep non-actionable properties visible with a clear reason.
- Keep the implementation frontend-only.

**Non-Goals:**
- No backend or protocol changes.
- No house or hotel selling, no repayment planner, no partial payments, and no debt negotiation.
- No bankruptcy rule redesign.

## Decisions

### 1. Reuse the dominant deficit stage card as the recovery surface

The existing deficit summary card will absorb the recovery asset panel instead of leaving actions in a disconnected secondary card.

Why:
- The spec already requires recovery actions to appear alongside the deficit explanation.
- This keeps the crisis readable as one coherent room stage.

### 2. Show each owned property as a recovery asset row

Each property in the acting player's portfolio will appear with label, current mortgage state, mortgage value when available, and whether it can be selected now.

Why:
- It turns mortgage recovery into an asset decision instead of a blind command list.
- It preserves visibility for observers and reconnecting players.

### 3. Derive recovery impact locally from the authoritative snapshot

The client will compute projected shortfall after mortgaging an eligible property using known tile price and current debt state.

Why:
- The backend protocol already exposes enough information.
- This gives the player the consequence of a click before they commit.

## Risks / Trade-offs

- [Client-side recovery projection differs from backend settlement] -> Limit projection to simple arithmetic on authoritative price and shortfall while leaving final authority to the server.
- [Recovery panel becomes too dense on small screens] -> Keep the summary concise and use stacked asset cards on mobile.
- [Players may expect additional recovery actions once the panel looks richer] -> Explicitly keep the scope to mortgage or bankruptcy.

## Migration Plan

1. Add OpenSpec deltas for deficit recovery asset-panel behavior.
2. Refactor the room page deficit stage to include recovery assets and impact labels.
3. Add one Playwright scenario for a live mortgage-based recovery.
4. Validate with lint, backend regression, and frontend end-to-end coverage.
