---
description: "Use when designing or implementing the web client, board rendering, Tauri shells, frontend state, UI flows, or multiplayer gameplay presentation for the Monopoly project."
name: "Frontend Gameplay Instruction"
applyTo: "frontend/**"
---

# Frontend Gameplay Guidelines

- The web app is the source product. Desktop and mobile shells should reuse the web client wherever possible.
- Default stack choices are React, TypeScript, Vite, PixiJS, and Playwright.
- Keep board rendering, animation, and interaction logic separate from rule calculation.
- Treat the frontend as a projection of authoritative backend state. Client-side optimism is acceptable only for animations and must reconcile cleanly.
- Use config-driven definitions for tiles, districts, card decks, visual themes, and localized labels.
- Keep all game flow screens responsive: lobby, room settings, board scene, auction, card resolution, bankruptcy review, and results.

## UX Expectations

- The board should remain readable at a glance, with clear tile ownership, buildings, mortgage state, player positions, and turn focus.
- Use overlays or side panels for dense management actions instead of shrinking the board until it becomes illegible.
- Prefer staged animations that explain state transitions over flashy but ambiguous motion.
- Sound, vibration, and bridge integrations must be adapter-based so Tauri and HarmonyOS shells can evolve independently.

## Technical Boundaries

- Keep game scene components thin; move engine logic into isolated modules.
- Model commands and events explicitly. Do not mutate ad hoc nested objects across the UI.
- Record enough state to support reconnection, replay, or spectator mode later.