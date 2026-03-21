# Monopoly Default Workflow Prompt

在本仓库中工作时，请默认按以下流程推进，除非用户明确要求跳过某一步，或某角色与当前任务无关且已记录豁免。

## 总体原则

- 这是一个 Web 优先的大富翁项目，后端权威，前端是投影层。
- 重大变更必须先走 OpenSpec。
- 每轮开始先检查 git working tree。
- 重大工作开始前先初始化角色轮转状态。
- 每个角色完成后必须登记 `complete`，不适用时必须登记 `waive`。
- 在编辑、提交、推送、发版前，先确认 workflow gate 已满足。

## 默认角色顺序

1. `Monopoly Product Manager`
   - 负责目标、范围、优先级、玩家价值与验收标准。
2. `Monopoly UI UX Director`
   - 负责信息层级、交互清晰度、视觉方向、响应式与游戏感。
3. `Monopoly Rules Expert`
   - 负责审查 OpenSpec 和功能设计是否符合经典大富翁的规则心智、公平性、节奏与经济压力。
4. `Monopoly Tech Lead`
   - 负责架构边界、前后端职责、状态流、自动化与切片策略。
5. `Monopoly Pixi Scene Engineer`
   - 仅当任务以棋盘渲染、镜头、棋子动画、Pixi 场景结构或画布性能为中心时启用。
6. `Monopoly Senior Implementer`
   - 负责实现与最小闭环验证。
7. `Monopoly QA Lead`
   - 负责单测、集成、Playwright、回归风险与发布阻断判断。
8. `Monopoly Simulated Player`
   - 使用浏览器交互工具进行实际游玩与体验反馈。
   - 如可用，优先通过 `mcp_microsoft_pla_browser_click` 及相关浏览器工具执行游玩路径。
9. 用户确认
   - 若用户提出意见，回到相应上游角色重新走流程。
   - 若用户认可结果，进入提交与版本阶段。
10. `Monopoly Versioning Manager`
   - 负责 conventional commits、semver 影响、changelog 事实、tag 与发布治理审查。
11. Git 提交与推送
   - 仅在 workflow gate 满足后执行。
12. `Monopoly Release Marketer`
   - 仅在准备发版时介入，基于版本事实输出中英文营销文案与更新说明。

## 强制执行要求

- 重大工作开始前执行：

```bash
python3 .github/hooks/scripts/role_rotation.py init --mode implementation --change <active-change>
```

- 每个角色完成后执行：

```bash
python3 .github/hooks/scripts/role_rotation.py complete --role "<role name>" --note "<summary>"
```

- 角色不适用时执行：

```bash
python3 .github/hooks/scripts/role_rotation.py waive --role "<role name>" --reason "<reason>"
```

- 在编辑、提交、推送、发版前执行：

```bash
python3 .github/hooks/scripts/role_rotation.py status --json
```

## 前端与 Pixi 约束

- 棋盘渲染、镜头运动、棋子动画、画布交互优先使用 PixiJS。
- 菜单、表单、交易面板、拍卖面板、结算弹层等高密度交互优先放在 DOM overlay。
- 不要把规则计算塞进 Pixi 或 React 组件。

## 输出要求

- 每轮汇报必须包含角色分工总结：用了哪些角色、各自做了什么、哪些由主代理完成。
- 若本轮没有调用额外角色，也要明确说明。
- 如果准备提交，先说明提交原因、涉及文件、验证结果，再执行提交。