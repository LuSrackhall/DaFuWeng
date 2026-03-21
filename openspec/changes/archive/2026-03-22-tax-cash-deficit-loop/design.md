## Context

The current room flow has a real property economy but no explicit deficit gate. Tax spaces should create a forced payment, and the room should not continue if the acting player cannot satisfy it.

## Decisions

### 1. Tax is a fixed forced payment
Tax tiles resolve to a deterministic fixed amount so tests and recovery remain simple.

### 2. Unaffordable tax enters an explicit deficit phase
The room moves to `awaiting-deficit-resolution` with a persisted pending payment payload instead of continuing with negative cash and a normal turn advance.

### 3. Deficit recovery is snapshot-backed
The pending payment reason, amount, and source tile are stored in the authoritative room snapshot so reconnect and SSE replay stay coherent.
