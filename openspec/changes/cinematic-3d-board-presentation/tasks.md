# Tasks

## 1. Planning And Boundaries

- [ ] 1.1 Translate the planning decisions into a web-game-client delta spec before implementation begins.
- [ ] 1.2 Define the board presentation adapter contract that separates projection truth, local settings, capability tiers, and renderer-only animation state.
- [ ] 1.3 Define the user-facing presentation choices and reduced-motion behavior without exposing raw graphics jargon as the primary UX.

## 2. Renderer Strategy

- [ ] 2.1 Keep the current Pixi board as the permanent baseline and low-end fallback renderer.
- [ ] 2.2 Adopt `three.js` plus `react-three-fiber` as the cinematic 3D renderer path without changing authoritative board semantics.
- [ ] 2.3 Keep DOM room actions, recent events, diagnostics, and accessibility summaries outside the 3D renderer so dense management flows remain stable.
- [ ] 2.4 Define how the 2D Pixi renderer and the 3D `react-three-fiber` renderer share the same presentation adapter and fallback contract.

## 3. Authority-Safe Cinematic Cues

- [ ] 3.1 Implement 3D dice reveal as a confirmed-result presentation only, never as a client-side authority source.
- [ ] 3.2 Implement stepwise token movement only for single-player, safe, provable forward paths.
- [ ] 3.3 Downgrade ambiguous, reconnect, teleport, jail, card-driven, or catch-up movement cases to safe non-misleading presentation.
- [ ] 3.4 Keep landing emphasis, turn handoff, and high-pressure phase cues non-blocking relative to authoritative room controls.

## 4. Settings And Capability Tiers

- [ ] 4.1 Add local, versioned, sanitized presentation settings for classic versus immersive viewing and restrained motion preferences.
- [ ] 4.2 Add capability-tier resolution for static, reduced, standard, and enhanced presentation levels.
- [ ] 4.3 Add runtime downgrade behavior so long-frame, thermal, or stability distress can reduce fidelity without breaking room semantics.
- [ ] 4.4 Preserve a full off path so low-end devices and manually opted-out users stay fully playable in the same room flow.

## 5. Validation

- [ ] 5.1 Add unit coverage for settings sanitize, capability resolution, cinematic plan derivation, and downgrade rules.
- [ ] 5.2 Add integration coverage for projection-to-presentation adapter behavior across reconnect, refresh, burst updates, and reduced-motion paths.
- [ ] 5.3 Add Playwright coverage for local presentation settings, non-blocking authoritative controls, and reconnect-safe cinematic behavior.
- [ ] 5.4 Define and run manual performance validation for desktop and mobile tiers, including long-session stability, reconnect recovery, and thermal behavior.
- [ ] 5.5 Explicitly document where automated coverage remains lagging for cinematic quality so release readiness does not overclaim confidence.

## 6. Governance

- [ ] 6.1 Re-check README and official documentation impact after the first implementation slice to decide whether the 3D presentation path changes long-term project facts.
- [ ] 6.2 Review semantic version and release-note impact once implementation scope becomes concrete.
