---
description: "Use when planning or implementing any substantial Monopoly, 大富翁, gameplay, architecture, backend, frontend, CI, release, or automation change in this repository. Covers the required OpenSpec workflow and artifact expectations."
---

# OpenSpec Delivery

- Start a new OpenSpec change before substantial work such as new game modes, board rule changes, persistence changes, room protocols, release automation, or cross-platform shell work.
- Prefer the spec-driven flow: proposal, design, then tasks.
- Keep the proposal user-facing and decision-oriented.
- Keep the design concrete: domain boundaries, data flow, state ownership, and failure handling.
- Break tasks into independently shippable units with validation steps.
- Use `openspec verify` or the repository's verify workflow before archiving a change.
- Archive a change only after implementation, test coverage, and spec alignment are complete.

## Monopoly-Specific Expectations

- Define how the change impacts multiplayer fairness, reconnection, turn order, and anti-desync guarantees.
- Describe whether the change affects board data, cards, economy tuning, animation, onboarding, or monetizable future surfaces.
- Call out backward compatibility for saved rooms, replay records, or PocketBase collections.