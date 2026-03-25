# Monopoly Daily Starter Prompt

按以下默认流程工作，除非我明确跳过某一步，或某角色已被合理豁免。

1. 先检查 git working tree。
2. 重大工作先走 OpenSpec，并执行：
   `python3 .github/hooks/scripts/role_rotation.py init --mode implementation --change <active-change>`
3. 默认角色顺序：
   - `Monopoly Product Manager`
   - `Monopoly UI UX Director`
   - `Monopoly UI UX Pro Max`
   - `Monopoly Rules Expert`
   - `Monopoly Tech Lead`
   - `Monopoly Full-Stack Performance Expert`（每轮都要判断性能与内存风险，必要时可豁免但不能默跳）
   - `Monopoly Pixi Scene Engineer`（仅在 Pixi/棋盘场景为中心时）
   - `Monopoly Senior Implementer`
   - `Monopoly QA Lead`（每轮都要判断单元、集成、E2E 是否落后，以及该改测试还是改业务逻辑）
   - `Monopoly Documentation Owner`（每轮都要判断 README 与官方文档是否需要同步更新）
   - `Monopoly Simulated Player`
   - 用户确认
   - `Monopoly Versioning Manager`
   - Git 提交与推送
   - `Monopoly Release Marketer`（角色仍存在，仅发版或外宣时介入）
4. 每个角色完成后执行：
   `python3 .github/hooks/scripts/role_rotation.py complete --role "<role name>" --note "<summary>"`
5. 不适用角色执行：
   `python3 .github/hooks/scripts/role_rotation.py waive --role "<role name>" --reason "<reason>"`
6. 编辑、提交、推送、发版前执行：
   `python3 .github/hooks/scripts/role_rotation.py status --json`
7. UI/UX 阶段必须使用 `.github/prompts/ui-ux-pro-max/`，让 `Monopoly UI UX Director` 与 `Monopoly UI UX Pro Max` 形成双专家讨论。
8. 棋盘渲染、镜头、棋子动画优先 PixiJS；高密度操作继续放在 DOM overlay。
9. 汇报时必须给出角色分工总结；若准备提交，先说明原因、文件与验证结果，再提交。
10. 汇报时必须明确写出 Documentation Owner 对 README 与官方文档的判断；若未调用 Release Marketer，也要说明是因为本轮并非发布或外宣切片。
11. 汇报时必须明确写出单元、集成、E2E 三层是否落后，以及性能专家给出的性能或内存风险判断。