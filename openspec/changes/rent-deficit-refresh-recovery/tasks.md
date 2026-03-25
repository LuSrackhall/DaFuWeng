# Tasks

## 1. Planning Artifacts

- [x] 1.1 Define the rent-deficit-refresh-recovery scope in proposal, design, and tasks.

## 2. Backend Recovery Loop

- [x] 2.1 Verify and, if needed, refine authoritative rent-deficit entry so player-creditor debt pauses normal turn flow with stable snapshot payloads.
- [x] 2.2 Verify and, if needed, refine mortgage recovery so rent debt can remain pending or settle cleanly after each action.
- [x] 2.3 Verify and, if needed, refine bankruptcy exits so player-creditor rent debt resolves without duplicate settlement or incorrect turn continuation.

## 3. Frontend Projection And Recovery

- [x] 3.1 Ensure room projection restores player-creditor rent deficit context from authoritative snapshots after refresh or reconnect.
- [x] 3.2 Ensure only the debtor remains actionable during rent deficit recovery and all other players stay read-only.

## 4. Validation

- [x] 4.1 Add or extend unit coverage for rent-deficit state transitions and recovery exits.
- [x] 4.2 Add or extend backend integration coverage for player-creditor rent deficit entry, refresh-safe snapshots, and recovery exits.
- [x] 4.3 Add one 4-player Playwright refresh recovery proof for rent deficit closure.
