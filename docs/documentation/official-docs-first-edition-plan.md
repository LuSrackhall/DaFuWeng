# 官方文档站首版规划

## 目标

这份文档用于沉淀 Da-Fu-Weng 官方文档站首版的信息架构、首页文案方向、推荐技术栈，以及 README 的精简改版边界。

目标不是直接实现 docs 站，而是先把首页、导航和 README 的职责切清楚，确保后续文档站落地时有一套与当前仓库真实状态一致的正式依据。

## 推荐技术栈

- Nextra
- Next.js
- MDX
- TypeScript
- Vercel

## 为什么选择这套技术栈

- 它与仓库当前的 Web-first、React、TypeScript 路线最一致。
- 它适合从文档站首版快速起步，同时保留后续扩展品牌化首页和结构化内容的空间。
- 它与 Vercel 的免费部署与预览流程天然契合。
- 它允许 README 保持短而准，把长期稳定说明迁移到结构化文档站中。

## 首页应该先讲什么

首版首页最重要的不是罗列功能，而是先把三个系统边界讲清楚：

1. 产品边界
   Da-Fu-Weng 当前最成熟的产品入口是 Web 客户端。桌面端、移动端与 HarmonyOS 目录已经存在，但当前仍以围绕同一套 Web 体验的壳层边界为主。

2. 系统边界
   后端是房间状态、回合推进、经济结算与多人一致性的权威事实来源。前端负责表现、交互与状态投影，不负责最终规则裁决。

3. 仓库边界
   共享协议与棋盘配置已经独立成层，平台壳、前端表现、后端规则和发布自动化是分层协作，而不是一个单体前端项目。

## 首页不该承载什么

首版首页不应承担“所有文档都放第一页”的职责。以下内容不应放到首页主体：

- 过长的本地开发命令与环境变量
- 目录级实现细节与每个子模块的代码说明
- 具体规则条目、卡牌机制、监狱细则或异常恢复长链路
- 发布流水线、CI 细节、语义版本判断策略
- 尚未落地的平台能力与未来路线图承诺

这些内容应分别进入快速开始、架构、发布和贡献文档中。

## 官方文档站首页文案骨架

### 标题区

Da-Fu-Weng

一个以 Web 为主入口、面向多人联机的大富翁项目。

### 引导说明

Da-Fu-Weng 围绕多人对局的一致性组织系统结构。当前最成熟的产品入口是 Web 客户端，后端负责房间状态、回合推进与主要经济结算的权威路径，桌面端、移动端与 HarmonyOS 当前则以平台壳边界的形式围绕同一套 Web 体验演进。

### 当前状态

- 当前仓库中，最成熟且可直接运行的体验是 Web 客户端配合 Go 后端
- 后端负责房间状态、回合推进与主要规则结算的权威路径
- 共享包已经承担协议与棋盘配置边界
- 发布与版本自动化已经是仓库基线能力
- 跨平台壳层目录已建立，但当前仍不是主要产品入口

### 项目边界

- 本项目不是以单机体验为中心的大富翁实现
- 当前官方叙述应以 Web-first、多人房间、后端权威为主线
- PocketBase 目前更接近持久化形态和接口边界对齐，而不是完整服务化主路径
- 官方文档站应只陈述已落地或已确认事实，不提前承诺未完成能力

### 核心系统分层

- Web 客户端：承担主要玩家入口与表现层
- 权威后端：承担房间、回合、规则与状态真相
- 共享协议与棋盘配置：承载跨端一致的数据边界
- 平台壳层与适配器：承载桌面、移动端和 Harmony 的宿主边界

### 推荐阅读路径

- 初次了解项目：先读项目定位、当前状态与能力边界
- 本地启动项目：先读快速开始与仓库结构
- 理解系统设计：继续读架构概览与首个可玩里程碑
- 参与仓库协作：继续读贡献说明、OpenSpec 工作流与测试发布策略
- 关注版本节奏：继续读发布自动化与发布产物说明

### 首页入口卡片建议

- 快速开始：了解依赖、启动方式与常用命令
- 架构：了解前端、后端、共享包与平台壳层边界
- 发布：了解语义化版本、自动发布与摘要产物
- 贡献：了解 OpenSpec、角色交接与质量门禁

## 顶部导航建议

- 首页
- 快速开始
- 架构
- 发布
- 贡献

## 侧边导航建议

### 快速开始

- 项目概览
- 环境要求
- 本地开发
- 仓库结构
- 常用命令

### 架构

- 架构总览
- 首个可玩里程碑
- Web 客户端边界
- 权威后端边界
- 共享协议与棋盘配置
- 平台壳层与适配器

### 发布

- 发布概览
- 发布自动化
- 发布产物
- 变更日志与发布说明

### 贡献

- 贡献入口
- OpenSpec 工作流
- AI 角色交接
- 测试与质量门禁

## docs-site 首版目录树建议

```text
docs-site/
  package.json
  next.config.mjs
  tsconfig.json
  theme.config.tsx
  public/
    logo.svg
    og-cover.png
  app/
    layout.tsx
    page.mdx
  content/
    index.mdx
    getting-started/
      overview.mdx
      local-development.mdx
    architecture/
      overview.mdx
      first-playable-milestone.mdx
    frontend/
      overview.mdx
    backend/
      overview.mdx
    multiplayer/
      room-lifecycle.mdx
      authoritative-turns.mdx
    release/
      overview.mdx
      automation.mdx
    collaboration/
      openspec-workflow.mdx
      roles-and-handoffs.mdx
    faq/
      common-questions.mdx
  components/
    callout.tsx
    feature-grid.tsx
    doc-section-card.tsx
```

## README 精简改版方案

### README 应保留什么

- 一句话项目定义
- 当前产品状态与支持边界
- 最快的本地启动路径
- 顶层仓库结构
- 指向官方文档、架构文档与发布文档的入口
- 简短贡献入口，并明确重大变更走 OpenSpec

### README 应迁出什么

- 完整产品定位叙事
- 平台壳层的详细解释
- 扩展架构说明
- 里程碑与能力边界的详细背景
- 发布策略、发布产物与自动化细节
- 多角色协作流程的长篇描述
- 不影响首次运行的阶段性实现说明

### README 目标结构

1. 项目简介
2. 当前状态
3. 快速开始
4. 仓库结构
5. 文档入口
6. 贡献入口

## 受众与写作约束

- README 的目标是让读者在几分钟内理解项目并启动本地环境
- 文档站首页的目标是解释产品事实、系统边界与阅读路径，而不是替代所有正文页面
- 长期文档应与短周期发布营销文案保持分离
- 官方文档只能写入已落地或已确认事实

## 当前依赖的事实来源

这份规划主要依赖以下现有文件中的已确认事实：

- [README.md](README.md)
- [docs/architecture/overview.md](docs/architecture/overview.md)
- [docs/architecture/first-playable-milestone.md](docs/architecture/first-playable-milestone.md)
- [docs/release/automation.md](docs/release/automation.md)

## 后续落地建议

1. 基于这份规划起草 docs 站首页与快速开始页
2. 把 README 收缩为入口型文档
3. 将架构、发布与贡献内容拆入文档站对应栏目
4. 等 docs-site 技术栈落地后，再决定是否将现有 `docs/` 内容迁移为站点内容源