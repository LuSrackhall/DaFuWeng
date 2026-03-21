---
name: ui-ux-pro-max-monopoly
description: 'Use the local ui-ux-pro-max design database and scripts as a mandatory reference during Monopoly UI/UX work when visual direction, layout quality, typography, color, or interaction polish needs deeper support.'
argument-hint: 'Describe the screen, flow, or UI problem to analyze with ui-ux-pro-max'
user-invocable: true
---

# UI UX Pro Max Monopoly

Use this skill when Monopoly UI/UX work needs a second, deeper design-system pass powered by the local ui-ux-pro-max prompt asset library.

## When To Use

- A screen, flow, or interaction needs stronger visual direction.
- The default UI UX Director pass should be challenged or refined.
- Typography, color, layout pattern, or UX anti-pattern guidance is needed.
- A board-adjacent UI or shell screen needs premium polish without losing clarity.

## Procedure

1. Read `.github/prompts/ui-ux-pro-max/PROMPT.md`.
2. Run the local search script with a Monopoly-specific query, for example:
   - `python3 .github/prompts/ui-ux-pro-max/scripts/search.py "monopoly board mobile game premium" --design-system -p "DaFuWeng"`
3. Extract only the relevant visual system guidance.
4. Filter the result through repository constraints.
   - Keep board readability first.
   - Prefer PixiJS for the board and DOM overlays for dense controls.
   - Avoid generic SaaS dashboard aesthetics when they dilute game feel.
5. Hand a concrete second-opinion design verdict back to `Monopoly UI UX Director` or the main coding agent.

## Output

- ui-ux-pro-max search summary
- Recommended design system direction
- Anti-patterns to avoid
- Monopoly-specific adaptation notes