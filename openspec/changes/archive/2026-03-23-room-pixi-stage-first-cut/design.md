## Context

The room page now has a scene-first shell, but the board remains a DOM grid placeholder. This creates a mismatch: the page says "game", while the board still says "debug prototype".

This first Pixi cut should establish the board as a real stage without overreaching into full animation systems or canvas-native interaction panels.

## Goals / Non-Goals

**Goals:**
- Mount a real Pixi application inside the current BoardScene boundary.
- Render a readable board ring, center stage, player tokens, current-turn emphasis, focus highlighting, and basic ownership accents.
- Keep the existing GamePage props contract stable.

**Non-Goals:**
- No walk-path animation system yet.
- No camera or drag-and-zoom system yet.
- No rule logic inside Pixi.
- No trade, auction, or deficit controls inside canvas.

## Decisions

### 1. Keep React as the shell and Pixi as the stage

BoardScene remains a React component, but its internals shift from DOM tiles to a Pixi application mounted into a host container.

Why:
- This preserves the current room integration surface.
- Future scene evolution can stay isolated from room rules and DOM stage cards.

### 2. Use explicit resize ownership

The Pixi stage should size itself from the host container through ResizeObserver and explicit renderer resizing.

Why:
- This keeps the stage aligned with the scene-first shell and responsive CSS.
- It avoids hidden resize behavior during future rail or viewport changes.

### 3. First cut prioritizes spatial understanding over animation

This slice should make players understand position, ownership, and focus immediately. It does not need to prove cinematic movement yet.

Why:
- Readability is the blocking issue.
- Animation without spatial clarity would not solve the current product problem.

## Risks / Trade-offs

- [Text inside tiles may still be denser than a final polished board] -> Acceptable because the main gain is moving from placeholder DOM tiles to a real scene.
- [No scene unit tests yet] -> Acceptable for this slice because lint and Playwright will cover mount stability and page integration.

## Migration Plan

1. Add OpenSpec artifacts for the first Pixi board cut.
2. Add board layout helpers for tile-to-grid mapping.
3. Replace BoardScene internals with a Pixi host and scene renderer.
4. Update board container CSS for a true stage host.
5. Validate with lint and Playwright.
