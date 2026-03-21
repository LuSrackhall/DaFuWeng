# Da-Fu-Weng

Web-first multiplayer Monopoly project.

## 仓库概览

- `frontend/`: React + TypeScript + Vite + PixiJS 的 Web 客户端。
- `backend/`: Go 编写的权威后端骨架，当前使用本地文件模拟 PocketBase 风格的持久化存储。
- `packages/`: 共享协议与棋盘配置。
- `apps/`: Tauri 桌面壳、移动壳、Harmony ArkWeb 壳边界。
- `openspec/`: 需求、设计、任务拆解与变更归档。
- `.github/`: Agents、Instructions、Skills、Hooks、CI、Release 自动化。

## 当前实现状态

- 可以本地跑起来的核心体验是 `frontend/` Web 客户端 + `backend/` HTTP API。
- 桌面端、移动端、Harmony 壳目录已存在，但当前仓库主运行入口仍然是 Web。
- 后端默认监听 `http://127.0.0.1:8080`。
- 前端默认运行在 `http://127.0.0.1:5173`，并通过 `VITE_API_BASE_URL` 访问后端；未设置时默认请求 `http://127.0.0.1:8080`。

## 本地运行前置条件

- Node.js 22 或更高版本
- pnpm 10
- Go 1.24 或更高版本

可参考：

```bash
node -v
pnpm -v
go version
```

## 首次安装

在仓库根目录执行：

```bash
pnpm install
```

Go 依赖会在首次运行后端时自动按 `backend/go.mod` 拉取。

## 启动后端

在一个终端中执行：

```bash
cd backend
go run ./cmd/api
```

默认配置如下：

- `DAFUWENG_HTTP_ADDR=:8080`
- `DAFUWENG_POCKETBASE_URL=http://127.0.0.1:8090`
- `DAFUWENG_POCKETBASE_DATA_PATH=.data/pocketbase-store.json`

说明：当前代码虽然保留了 PocketBase 配置项，但本地开发默认直接把房间快照与事件存到 `backend/.data/pocketbase-store.json`，并不要求你额外先启动 PocketBase 服务。

后端健康检查：

```bash
curl http://127.0.0.1:8080/healthz
```

返回 `ok` 即表示后端已经起来。

## 启动前端

在另一个终端中回到仓库根目录执行：

```bash
pnpm dev:frontend
```

然后打开：

```text
http://127.0.0.1:5173
```

如果你的后端地址不是默认值，可以这样启动前端：

```bash
VITE_API_BASE_URL=http://127.0.0.1:8080 pnpm dev:frontend
```

## 推荐本地启动顺序

```bash
# 终端 1
cd backend
go run ./cmd/api

# 终端 2
pnpm dev:frontend
```

## 常用检查命令

前端类型检查、测试、构建：

```bash
pnpm lint
pnpm test
pnpm build
```

后端测试：

```bash
cd backend
go test ./...
```

前端 E2E：

```bash
pnpm --filter @dafuweng/frontend exec playwright install chromium
pnpm --filter @dafuweng/frontend test:e2e
```

## 团队工作流

这个仓库已经按多 AI 角色协作的方向落了基础设施：

- `OpenSpec`：重大功能先走 proposal、design、tasks，再实现。
- `Agents`：产品经理、技术主管、高级实现、QA、模拟玩家、营销、Copilot 专家等角色已配置在 `.github/agents/`。
- `Skills`：提供多角色交付、OpenSpec 生命周期、发布自动化等能力，位于 `.github/skills/`。
- `Instructions`：按前端、后端、测试发布、OpenSpec 分层约束，位于 `.github/instructions/`。
- `Hooks`：会话启动与工具使用前的策略钩子位于 `.github/hooks/`。
- `CI/CD`：`.github/workflows/ci.yml` 与 `.github/workflows/release.yml` 负责校验和基于 semantic-release 的自动发版。

## 目前和最初设想的差距

- Web 优先架构已明确，并且是当前主实现面。
- Go 后端已存在，但 PocketBase 仍是“接口和持久化形态对齐”的阶段，尚不是完整 PocketBase 服务化集成。
- 多 AI 角色、Instructions、Skills、Hooks、OpenSpec 已具备并可用。
- GitHub Actions 持续集成与自动发布已接入。
- 桌面端、移动端、Harmony 壳目录已建好，但尚未形成完整可运行产品闭环。

## 相关文档

- 架构概览：`docs/architecture/overview.md`
- 首个里程碑：`docs/architecture/first-playable-milestone.md`
- 发布自动化：`docs/release/automation.md`
- OpenSpec 配置：`openspec/config.yaml`
