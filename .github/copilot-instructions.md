# Project Guidelines

## Product Direction

- This repository builds a classic Monopoly-style multiplayer game with a web-first architecture.
- The web client is the primary product. Desktop and mobile builds are shells around the web experience unless a platform capability forces a native bridge.
- Target clients are:
  - `frontend/`: web app, shared UI, shared gameplay presentation
  - Tauri shells for Windows, macOS, Linux, Android, and iOS
  - HarmonyOS shell through ArkWeb plus a JavaScript bridge contract aligned with the web app
- The backend lives in `backend/` and uses Go plus PocketBase.

## Default Technical Choices

- Frontend default stack: React, TypeScript, Vite, PixiJS for board rendering and piece animation, DOM overlays for menus and forms.
- Frontend state should separate deterministic gameplay state from presentation state. Do not couple board rules to React components.
- Backend default architecture: PocketBase as the data and realtime foundation, with Go services or hooks implementing authoritative game rules.
- Multiplayer is a first-class requirement. Room state, turn resolution, dice results, property ownership, rent, jail, cards, and bankruptcy must be server authoritative.

## Delivery Workflow

- Use OpenSpec for any non-trivial product, architecture, gameplay, persistence, release, or automation work.
- Prefer the existing prompts and skills in `.github/prompts/` and `.github/skills/openspec-*` to create, continue, apply, verify, and archive changes.
- Keep change names in kebab-case.
- Before implementation, make sure proposal, design, and tasks are present for the active change.

## AI Workflow Rules

- At the start of every new conversation, check the git working tree before proposing or implementing new work.
- If previously completed implementation work is still uncommitted and it belongs to the current coding agent, decide proactively whether to commit and push it instead of waiting for the user to ask.
- Do not mix unrelated user-owned local edits into agent commits. If the workspace is dirty because of unrelated changes, commit only the files that belong to the current slice and report the remaining dirty paths clearly.
- Prefer conventional commit messages with Chinese subjects, for example `feat: 完成双边交易闭环` or `fix: 修正卡牌欠款回放`.
- Treat commit and push as normal workflow decisions, not user-only actions, when the implementation slice is complete and validated.
- For substantial work, initialize repository workflow state with `python3 .github/hooks/scripts/role_rotation.py init --mode <planning|implementation|release> --change <active-change>` before editing files.
- After every required agent or subagent handoff, record the outcome with `python3 .github/hooks/scripts/role_rotation.py complete --role "<role name>" --note "<summary>"` or explicitly waive the role with `python3 .github/hooks/scripts/role_rotation.py waive --role "<role name>" --reason "<reason>"`.
- Do not attempt repository edits, commits, pushes, or release-like commands while workflow state is uninitialized, in `analysis` mode, or missing required roles.
- Use `python3 .github/hooks/scripts/role_rotation.py status --json` whenever you need to inspect the remaining workflow gates.
- In every conversation, explicitly clarify current progress and provide a role-by-role summary of which AI roles or subagents were used, what each one did, and which work remained with the main coding agent.
- If no extra AI roles were used in the round, state that explicitly in the progress summary.
- For Monopoly gameplay changes, prefer the sequence Product Manager -> UI UX Director -> Monopoly UI UX Pro Max -> Monopoly Rules Expert -> Tech Lead -> Senior Implementer -> QA Lead -> Simulated Player, with Monopoly Pixi Scene Engineer added when Pixi scene work is central.
- UI and UX work must use `.github/prompts/ui-ux-pro-max/` as a formal workflow asset, either through Monopoly UI UX Pro Max or as a mandatory reference for Monopoly UI UX Director.
- Before commit or release handoff, use Monopoly Versioning Manager to review semantic version impact, commit classification, and release facts.
- Every final response must end with a dedicated Closing Guidance block as the absolute last section of the message; no content may appear after this block.
- The Closing Guidance block must contain exactly two labeled lines in this fixed order: `Next best prompt:` followed by one concrete next prompt, then `New conversation:` followed by one absolute recommendation.
- The `Next best prompt:` line must provide exactly one immediately executable next prompt tailored to the current task state. Do not provide multiple alternatives or generic brainstorming prompts.
- The `New conversation:` line must use absolute wording only. Allowed outcomes are `必须另起新会话` or `不必另起新会话`.
- Use `必须另起新会话` only when the next best prompt requires a new isolated workflow, a new active OpenSpec change, a materially different task scope, or a cleaner context boundary; otherwise use `不必另起新会话`.
- Forbidden wording in `New conversation:` includes `可以`, `视情况`, `看需要`, `如果你愿意`, `maybe`, `optional`, and `depends`.
- The Closing Guidance block is mandatory even when the task is blocked; in blocked cases the next-best prompt must focus on the single highest-value unblock action.
- Any final response that omits the Closing Guidance block, changes the field order, emits more than one prompt, or uses hedged conversation guidance is non-compliant with repository policy.

## Engineering Rules

- Favor config-driven board definitions so map tiles, cards, rent bands, and rule variants can evolve without rewriting core logic.
- Keep gameplay rules deterministic and testable with pure functions wherever possible.
- Do not put business rules only on the client.
- Avoid single-player shortcuts in shared models. Local mock flows are acceptable only behind clear adapters.
- Maintain strict boundaries between gameplay engine, transport layer, persistence, and rendering.

## UX Rules

- The UI should feel like a premium board game, not a generic admin panel.
- Preserve board readability on desktop, tablet, and phone layouts.
- Use expressive typography, strong visual hierarchy, and intentional motion.
- Gameplay feedback must make turn order, dice results, tile effects, cash movement, ownership, and pending decisions immediately clear.
- Prefer PixiJS for board rendering, camera movement, piece animation, and scene-driven feedback whenever the task concerns the board itself. Keep dense management actions in DOM overlays instead of forcing everything into canvas.

## Testing And Quality

- Use unit tests for rule engines, rent calculation, movement, cards, jail rules, auctions, bankruptcy, and save or replay logic.
- Use Playwright for end-to-end flows such as room creation, matchmaking or invite flow, turn progression, property purchase, rent payment, chance or community chest resolution, reconnection, and settlement.
- Treat pre-release playtesting as required work, not optional polish.

## Release And Automation

- Versioning, changelog generation, Git tags, GitHub Releases, and release notes should be automated through GitHub Actions.
- Use conventional commits so automation can decide semantic version bumps.
- Prefer CI builds and release pipelines over local release operations.
- If a workflow changes release behavior, document the intended commit flow, version source of truth, and rollback path.
