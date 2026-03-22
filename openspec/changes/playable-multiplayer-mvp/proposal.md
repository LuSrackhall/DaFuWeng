## Why

The current web client can render room state and invoke many commands, but it still behaves like a prototype instead of a trustworthy multiplayer game. The main blockers are that the product falls back into demo data when the backend is unavailable, and that player identity is effectively self-reported by the frontend rather than bound by the backend.

This change is needed now because users can run the project and still fail to complete a believable two-player match loop. Before adding more Monopoly depth, the project needs one authoritative, reconnect-safe, genuinely multiplayer MVP path.

## What Changes

- Add a room-scoped player session model so room creation and room join return a server-issued player token that must accompany subsequent mutating commands.
- Remove demo-room and local sample fallback from the formal lobby and game flow so the web client either shows a real backend room or an explicit failure or spectator state.
- Tighten the multiplayer MVP around one trustworthy loop: create room, join room, start room, roll, move, buy or skip property, pay rent, refresh, and continue from the same authoritative room state.
- Clarify room entry and room page UX so players can tell whether they are entering as a joined player, rejoining from stored credentials, or viewing a room without command privileges.
- Add automated verification for the real two-browser happy path rather than relying on sessionStorage hacks or direct fetch shortcuts.

## Capabilities

### New Capabilities
- `room-player-session`: Server-issued room-scoped player identity and command authorization for multiplayer rooms.

### Modified Capabilities
- `multiplayer-room-lifecycle`: Room create, join, start, and reconnect behavior now require authoritative room-scoped player sessions instead of frontend-only player identity.
- `web-game-client`: The formal web room flow now renders explicit real-room, reconnect, and spectator states instead of silently falling back to local sample gameplay.
- `realtime-projection-recovery`: Refresh and reconnect behavior now restore the same authoritative room only when a valid room-scoped player session or spectator read path exists.

## Impact

- Affected code: backend room HTTP handlers and room state persistence, shared contracts, lobby and game screens, frontend room projection and active player storage, and end-to-end tests.
- Affected APIs: room create and join responses, mutating room commands, and room fetch behavior for reconnect or spectator flows.
- Affected systems: authoritative multiplayer identity, reconnect safety, and the web-first MVP onboarding path.
- Dependencies: existing Go room service, local PocketBase-style persistence, shared contracts package, and Playwright coverage.
