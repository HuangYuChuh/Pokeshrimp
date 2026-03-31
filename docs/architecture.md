# Pokeshrimp 技术架构文档

> 版本: v0.2 | 更新日期: 2026-03-31 | 状态: 实施中

---

## 一、架构总览

Pokeshrimp 采用 **Core + Shell** 分层架构。`core/` 是框架无关的业务逻辑层，GUI（Electron + Next.js）和未来的 CLI 都是它的消费者。

```
┌─────────────────────────────────────────────────┐
│                   入口层                         │
│  ┌──────────────┐  ┌──────────────┐             │
│  │ Electron GUI │  │  CLI (未来)   │             │
│  │  Next.js App │  │  命令行入口   │             │
│  └──────┬───────┘  └──────┬───────┘             │
│         │                  │                     │
│─────────┼──────────────────┼─────────────────────│
│         ▼                  ▼                     │
│  ┌───────────────────────────────────────┐       │
│  │            src/core/ 核心层            │       │
│  │                                       │       │
│  │  tool/       统一工具接口 + 执行器     │       │
│  │  permission/ 权限规则引擎             │       │
│  │  hooks/      事件驱动 Hook 系统       │       │
│  │  config/     三级配置 + Zod 验证      │       │
│  │  mcp/        MCP 客户端 + Tool 适配   │       │
│  │  skill/      Skill 引擎 + Runner     │       │
│  │  session/    会话 + 消息持久化         │       │
│  │  ai/         LLM 调度 + 流式响应      │       │
│  │  state.ts    集中状态管理             │       │
│  └───────────────────────────────────────┘       │
│                                                   │
│  ┌───────────────────────────────────────┐       │
│  │          外部依赖                      │       │
│  │  Vercel AI SDK · MCP SDK · SQLite     │       │
│  │  Anthropic · OpenAI · Zod             │       │
│  └───────────────────────────────────────┘       │
└─────────────────────────────────────────────────┘
```

### 核心原则

1. **Core 不依赖框架** — `src/core/` 不 import Next.js、React、Electron 的任何模块
2. **参数化而非硬编码** — 路径、API Key、配置都通过参数传入，不在 core 里读文件
3. **统一接口** — 所有工具（MCP、CLI Skill、内置）实现同一个 `Tool` 接口
4. **层级配置** — 全局 > 项目 > 本地，Zod schema 验证
5. **事件驱动** — Hooks 系统在工具执行前后触发，支持外部命令扩展

---

## 二、目录结构

```
src/
├── core/                          # 核心层（框架无关）
│   ├── tool/
│   │   ├── types.ts              # Tool, ToolContext, ToolResult, PermissionResult
│   │   ├── registry.ts           # ToolRegistry — 工具注册表
│   │   ├── executor.ts           # executeTool() — 验证→权限→hooks→执行
│   │   └── index.ts
│   ├── permission/
│   │   ├── types.ts              # PermissionRule, PermissionConfig
│   │   ├── checker.ts            # 规则匹配引擎（deny > allow > ask）
│   │   └── index.ts
│   ├── hooks/
│   │   ├── types.ts              # HookEvent, HookAction, HookInput/Output
│   │   ├── engine.ts             # runHooks() — matcher + spawn + JSON stdin/stdout
│   │   └── index.ts
│   ├── config/
│   │   ├── schema.ts             # Zod schema（AppConfig 及子模块）
│   │   ├── loader.ts             # 三级配置加载 + deep merge
│   │   └── index.ts
│   ├── mcp/
│   │   ├── client.ts             # MCPClientManager — 多连接管理
│   │   ├── adapter.ts            # MCP tool → Tool 接口适配
│   │   └── index.ts
│   ├── skill/
│   │   ├── types.ts              # Skill, SkillInputParam, SkillOutput
│   │   ├── engine.ts             # 解析 .skill.md + 两级作用域加载
│   │   ├── runner.ts             # buildSkillPrompt() — 构造增强 prompt
│   │   └── index.ts
│   ├── session/
│   │   ├── types.ts              # Session, Message, ToolCall
│   │   ├── manager.ts            # SessionManager — SQLite CRUD
│   │   └── index.ts
│   ├── ai/
│   │   ├── provider.ts           # 多模型支持（Vercel AI SDK）
│   │   ├── streaming.ts          # 系统 prompt + 流式工具
│   │   └── index.ts
│   └── state.ts                  # 集中状态 initAppState() / getAppState()
│
├── app/                          # Next.js App Router（GUI 入口）
│   ├── api/chat/route.ts         # POST /api/chat — 流式对话
│   ├── api/sessions/route.ts     # GET/POST /api/sessions
│   ├── api/sessions/[id]/route.ts # GET/DELETE /api/sessions/:id
│   ├── layout.tsx                # 根布局
│   ├── page.tsx                  # 首页（三栏布局）
│   └── globals.css               # 全局样式 + CSS 变量
│
├── components/                   # React 客户端组件
│   ├── sidebar.tsx               # 左侧边栏（会话列表 + 模型选择）
│   ├── chat-panel.tsx            # 中间对话区（流式 + 工具调用展示）
│   ├── preview-panel.tsx         # 右侧预览/编辑/输出面板
│   └── model-options.ts          # 模型选项（客户端镜像）
│
├── lib/                          # 兼容层（re-export from core/）
│   ├── ai.ts                     # → core/ai/provider
│   ├── config.ts                 # → core/config/loader
│   ├── db.ts                     # → core/session/manager (singleton)
│   ├── mcp.ts                    # → core/mcp/client (singleton)
│   ├── skill-engine.ts           # → core/skill/engine
│   ├── system-prompt.ts          # → core/ai/streaming
│   ├── types.ts                  # → core/session/types + 本地补充类型
│   └── store.tsx                 # React 客户端状态（Context + Reducer）
│
└── cli/                          # CLI 入口（未来）
    └── index.ts

electron/                         # Electron 主进程
├── main.ts                       # 窗口创建 + Next.js 服务器管理
└── preload.ts                    # 安全的 contextBridge API

.visagent/                        # 项目级配置（可被 Git 管理）
├── skills/                       # 项目级 Skill 文件
├── hooks/                        # Hook 脚本
├── .history/                     # 资产版本仓库（gitignored）
├── designfile.yaml               # 资产依赖图
└── memory.md                     # 项目级长期记忆
```

---

## 三、核心模块详解

### 3.1 Tool 系统

**设计灵感**: Claude Code 的 Tool-as-Object 模式。

所有工具实现统一的 `Tool` 接口：

```typescript
interface Tool {
  name: string;
  description: string;
  inputSchema: z.ZodType;        // Zod schema 验证输入

  isReadOnly(): boolean;          // 是否只读
  isDestructive?(): boolean;      // 是否有破坏性
  isConcurrencySafe?(): boolean;  // 是否可并发执行

  checkPermissions(input, context): Promise<PermissionResult>;
  call(input, context): Promise<ToolResult>;

  isMcp?: boolean;                // 是否来自 MCP Server
  serverName?: string;            // MCP Server 名称
}
```

**工具来源**:

| 来源 | 注册方式 | 示例 |
|------|---------|------|
| MCP Server | `registerMCPTools()` 自动适配 | comfyui-server, bg-remove-server |
| CLI Skill | Agent 通过 shell 执行 | ffmpeg, rembg, imagemagick |
| 内置工具 | 手动注册 | 文件系统操作 |

**执行流程** (`executeTool()`):

```
输入 → Zod 验证 → 权限检查 → PreToolUse Hook → call() → PostToolUse Hook → 返回结果
                     ↓                  ↓                        ↓
                  deny → 拒绝       deny → 拒绝          失败 → PostToolUseFailure Hook
```

### 3.2 Permission 系统

**设计灵感**: Claude Code 的三级权限规则。

```typescript
interface PermissionConfig {
  alwaysAllow: string[];   // 如 ["Read", "Glob", "Grep"]
  alwaysDeny: string[];    // 如 ["Bash(rm -rf *)"]
  alwaysAsk: string[];     // 如 ["Bash", "Edit"]
}
```

**规则格式**: `ToolName(pattern)`
- `"Read"` — 匹配所有 Read 调用
- `"Bash(npm run *)"` — 匹配 Bash 且第一个参数匹配 `npm run *`
- `"Edit(docs/**)"` — 匹配 Edit 且路径匹配 `docs/**`

**检查优先级**: deny > allow > ask > 默认 ask

### 3.3 Hooks 系统

**设计灵感**: Claude Code 的 Hooks + 产品文档中的 post-generate / pre-export。

**支持的事件**:

| 事件 | 触发时机 | 典型用途 |
|------|---------|---------|
| PreToolUse | 工具执行前 | 拦截/修改输入 |
| PostToolUse | 工具执行后 | 日志、通知 |
| PostToolUseFailure | 工具执行失败 | 错误处理 |
| PostGenerate | 图片生成后 | 自动加水印、上传 CDN |
| PreExport | 导出前 | 校验尺寸、格式 |
| OnApprove | 用户确认方案后 | 更新 Designfile |
| SessionStart / SessionEnd | 会话生命周期 | 初始化/清理 |

**Hook 执行机制**: spawn 外部命令 → JSON stdin → JSON stdout

```json
// .visagent/config.json
{
  "hooks": {
    "PostGenerate": [
      {
        "matcher": "image-gen-server",
        "hooks": [{ "type": "command", "command": "python add_watermark.py" }]
      }
    ]
  }
}
```

### 3.4 Config 系统

**设计灵感**: Claude Code 的分层配置 + Zod 验证。

**三级配置**（优先级从低到高）:

| 级别 | 路径 | Git 管理 | 用途 |
|------|------|---------|------|
| 全局 | `~/.visagent/config.json` | 否 | API Key、默认模型 |
| 项目 | `.visagent/config.json` | 是 | MCP Servers、Hooks、团队共享配置 |
| 本地 | `.visagent/config.local.json` | 否（gitignored） | 个人覆盖、本地路径 |

所有配置通过 `AppConfigSchema`（Zod）验证，提供类型安全和默认值。

### 3.5 MCP 集成

**MCPClientManager**: 管理多个 MCP Server 连接。

**MCP → Tool 适配**: `createMCPTool()` 将 MCP 发现的工具包装成 `Tool` 接口，自动注册到 `ToolRegistry`。这样 MCP 工具和内置工具对执行器来说完全一致。

**支持的传输**: stdio（当前）、SSE 和 HTTP（配置已支持，实现待扩展）。

### 3.6 Skill 系统

**Skill 文件格式** (`.skill.md`):

```markdown
---
name: 批量去背景
description: 批量移除图片背景
command: /batch-remove-bg
requiredTools:
  - bg-remove-server
inputParams:
  - name: input_dir
    type: string
---

## 执行步骤
### Step 1: 扫描目录
...
```

**两级作用域**:
- 全局: `~/.visagent/skills/`
- 项目: `.visagent/skills/`（项目级覆盖全局同名 Skill）

**Skill Runner**: `buildSkillPrompt(skill, params)` 将 Skill 定义 + 用户参数构造为增强 prompt，注入到 AI 对话中。Skill 本质是**领域知识编码器**。

### 3.7 Session 管理

**SessionManager**: 封装 SQLite（better-sqlite3）操作。

**数据库 Schema**:
- `sessions` — id, title, created_at, updated_at
- `messages` — id, session_id (FK), role, content, created_at
- `tool_calls` — id, message_id (FK), session_id (FK), tool_name, args, result, status

**特性**: WAL 模式、外键约束、UUID 主键、ISO 8601 时间戳。

---

## 四、数据流

### 4.1 用户发送消息

```
用户输入 → ChatPanel (useChat) → POST /api/chat
  → 自动创建 Session（如果没有）
  → 持久化用户消息
  → streamText(model, messages, systemPrompt)
  → SSE 流式返回文本
  → 持久化 AI 回复
  → 前端实时渲染
```

### 4.2 工具调用（未来完整流程）

```
AI 返回 tool_use → executeTool()
  → ToolRegistry.getTool(name)
  → inputSchema.safeParse(input)
  → PermissionChecker.checkPermission(name, input, config)
  → HooksEngine.runHooks("PreToolUse", ...)
  → tool.call(input, context)
  → HooksEngine.runHooks("PostToolUse", ...)
  → 返回 tool_result 给 AI 继续对话
```

### 4.3 Skill 执行

```
用户输入 /batch-remove-bg → 解析 slash command
  → SkillEngine.getSkillByCommand("/batch-remove-bg")
  → SkillRunner.buildSkillPrompt(skill, params)
  → 将增强 prompt 注入消息 → AI 按步骤执行
  → AI 逐步调用 requiredTools → executeTool() 循环
```

---

## 五、技术选型

| 决策点 | 选型 | 理由 |
|--------|------|------|
| 桌面框架 | Electron | JS 全栈统一，社区成熟 |
| 前端框架 | Next.js App Router + React 19 | Vercel AI SDK 官方支持，SSR + API routes |
| 样式 | CSS Variables + Tailwind v4 | 主题化 + 快速开发 |
| LLM 调度 | Vercel AI SDK | 统一接口，多模型切换 |
| 工具协议 | MCP TypeScript SDK | 行业标准，生态复用 |
| 数据库 | SQLite (better-sqlite3) | 嵌入式，零配置 |
| Schema 验证 | Zod | 类型安全，配置验证 |
| 语言 | TypeScript (strict) | 全栈统一，类型安全 |

---

## 六、开发规范

### 6.1 代码组织

- `src/core/` 中的代码 **禁止** import `next`、`react`、`electron` 模块
- 每个 core 子模块有 `index.ts` 作为公共 API 入口
- `src/lib/` 是兼容层，只做 re-export + singleton 实例化
- `src/app/api/` 路由是薄包装，业务逻辑在 core/ 中
- 组件文件使用 `"use client"` 标记

### 6.2 类型规范

- 所有外部输入用 Zod schema 验证
- 内部接口用 TypeScript interface 定义
- 配置文件格式由 `core/config/schema.ts` 作为唯一真相源
- 导出类型时用 `export type` 而非 `export`

### 6.3 文件命名

- 目录名: 小写 kebab-case
- 文件名: 小写 kebab-case（`.ts` / `.tsx`）
- 组件文件名: 小写 kebab-case（如 `chat-panel.tsx`）
- 类型文件: `types.ts`
- 入口文件: `index.ts`

### 6.4 新增工具的流程

1. 实现 `Tool` 接口（`core/tool/types.ts`）
2. 在启动时注册到 `ToolRegistry`
3. 如果是 MCP 工具：用 `createMCPTool()` 适配
4. 如果需要权限控制：在配置的 `permissions` 中添加规则
5. 如果需要 Hook：在配置的 `hooks` 中添加事件监听

### 6.5 新增 Skill 的流程

1. 创建 `.skill.md` 文件（YAML frontmatter + Markdown 步骤）
2. 放入 `~/.visagent/skills/`（全局）或 `.visagent/skills/`（项目）
3. 声明 `requiredTools`（必须是已注册的工具名）
4. 用户通过 `/{command}` 调用

---

## 七、配置文件参考

### .visagent/config.json（项目级）

```json
{
  "defaultModel": "claude-sonnet",
  "mcpServers": {
    "comfyui": {
      "command": "node",
      "args": ["path/to/comfyui-mcp-server/index.js"],
      "transport": "stdio",
      "enabled": true
    },
    "bg-remove": {
      "command": "python",
      "args": ["-m", "bg_remove_server"],
      "transport": "stdio",
      "enabled": true
    }
  },
  "permissions": {
    "alwaysAllow": ["Read", "Glob", "Grep"],
    "alwaysDeny": ["Bash(rm -rf *)"],
    "alwaysAsk": ["Bash", "Edit"]
  },
  "hooks": {
    "PostGenerate": [
      {
        "matcher": "image-gen-server",
        "hooks": [
          { "type": "command", "command": "python .visagent/hooks/add-watermark.py" }
        ]
      }
    ]
  }
}
```

### ~/.visagent/config.json（全局）

```json
{
  "defaultModel": "claude-sonnet",
  "apiKeys": {
    "anthropic": "sk-ant-...",
    "openai": "sk-..."
  }
}
```

---

## 八、路线图

### 已完成

- [x] Electron + Next.js 桌面框架
- [x] 三栏 UI（Sidebar + Chat + Preview）
- [x] Vercel AI SDK 多模型集成
- [x] SQLite 会话持久化
- [x] MCP Client 基础实现
- [x] Skill 引擎（解析 + 两级作用域）
- [x] **Core 架构重构**（Tool/Permission/Hooks/Config/MCP/Skill/Session/AI）

### 下一步

- [ ] UI 设计重做（找设计参考，达到 Linear/Cursor 级别）
- [ ] 完整的 tool_use 循环（AI → 工具调用 → 结果返回 → 继续对话）
- [ ] 第一个可用的 MCP Server 接入（如 filesystem 或 bg-remove）
- [ ] Slash Command UI（输入框中 `/` 触发 Skill 列表）
- [ ] CLI 入口（`npx pokeshrimp chat`）
- [ ] 版本管理（.visagent/.history/ 内容寻址存储）
- [ ] Designfile 引擎（资产依赖图 + 增量重生成）
