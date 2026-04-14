<div align="center">

<!-- TODO: 补充 banner 图 -->

<h1>Pokeshrimp</h1>

<p><strong>Humans use GUI, Agents use CLI, Creators use Pokeshrimp.</strong></p>

<p>一个面向图像与视频工作流的 AI 桌面工作台，把聊天式交互、本地 Agent Runtime、Skill 驱动的 CLI 编排放进同一个可编辑工作空间里。</p>

<p>
  <a href="https://github.com/HuangYuChuh/Pokeshrimp/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-Apache%202.0-10B981?style=flat" alt="License" /></a>
  <a href="https://github.com/HuangYuChuh/Pokeshrimp/stargazers"><img src="https://img.shields.io/github/stars/HuangYuChuh/Pokeshrimp?style=flat&color=EAB308&logo=github" alt="Stars" /></a>
  <a href="https://github.com/HuangYuChuh/Pokeshrimp/network/members"><img src="https://img.shields.io/github/forks/HuangYuChuh/Pokeshrimp?style=flat&color=F97316&logo=github" alt="Forks" /></a>
  <a href="https://github.com/HuangYuChuh/Pokeshrimp/issues"><img src="https://img.shields.io/github/issues/HuangYuChuh/Pokeshrimp?style=flat&color=3B82F6" alt="Issues" /></a>
</p>

<p>
  <a href="#overview">概览</a> ·
  <a href="#current-status">当前状态</a> ·
  <a href="#quick-start">快速开始</a> ·
  <a href="#configuration">配置</a> ·
  <a href="#skills">Skills</a> ·
  <a href="#architecture">架构</a>
</p>

<p>
  <a href="./README.md">English</a> ·
  <strong>简体中文</strong> ·
  <a href="./README.zh-TW.md">繁體中文</a> ·
  <a href="./README.ja.md">日本語</a>
</p>

</div>

---

<a id="overview"></a>

## 概览

Pokeshrimp 的核心思路很简单：

**人不应该去背命令，但 Agent 应该能熟练调用命令。**

很多图像和视频工具已经有 CLI、API、ComfyUI 工作流、MCP Server，但它们通常分散在不同地方，导致真实创作流程很割裂。Pokeshrimp 想做的是把这些能力放进一个本地优先的工作台里：

- 桌面端负责聊天式交互
- Agent Runtime 负责理解意图和调用工具
- Skill 负责教 Agent 如何使用某类工具或工作流
- 所有过程都尽量落到文件、命令和结构化配置上，方便编辑、追踪和复用

这个仓库目前更接近一个“产品基础骨架”，而不是已经全部打磨完成的创作套件。桌面壳、CLI、Skill 扫描、会话持久化、内置工具链已经具备；更完整的 MCP 创作能力、右侧创作面板联动、自动化工作流还在继续接线。

## 为什么做这个项目

现在的创作工具有三个典型问题：

- 纯 GUI 工具适合人用，但不适合自动化
- 纯 CLI 工具适合 Agent 用，但对大部分创作者不友好
- 云端 Agent 产品好上手，但执行层往往不透明，本地工作流也不容易复用

Pokeshrimp 想补的是中间这层：

- 用聊天描述需求
- 用 Skill 沉淀工具知识
- 用本地执行接管文件、模型和命令
- 让 GUI 和 CLI 共用同一个 Runtime

<a id="current-status"></a>

## 当前状态

当前仓库里已经落地的部分：

| 模块 | 当前状态 |
|------|----------|
| 桌面应用 | Electron 启动本地 Next.js 界面 |
| 聊天界面 | 对话区、模型切换、设置弹窗、最近会话侧边栏 |
| Agent Runtime | 基于 Vercel AI SDK 的工具调用循环 |
| 内置工具 | `read_file`、`write_file`、`list_directory`、`run_command` |
| Skills | 支持全局和项目级 `.skill.md` 扫描，并在输入 `/` 时提示 |
| 数据持久化 | SQLite 保存会话和消息 |
| CLI 模式 | 终端 REPL，可复用同一套核心 Runtime |
| 配置系统 | 全局 / 项目 / 本地三级 JSON 配置合并 |

已经有代码骨架，但还应该按“进行中”理解的部分：

| 模块 | 说明 |
|------|------|
| MCP 集成 | 已有 client / adapter 层，但默认运行链路里还没有完整注册成可直接使用的工具 |
| 预览 / 输出面板 | Store 和组件已存在，但主界面里还没有完整接上真实创作结果 |
| Hooks / 高级自动化 | Schema 和执行器已存在，但还不是完整的终端用户工作流 |
| 权限审批体验 | 配置层支持 allow / deny 规则，但还没有完整交互式审批 UI |

<a id="quick-start"></a>

## 快速开始

### 环境要求

| 依赖 | 版本 |
|------|------|
| Node.js | >=20.17 |
| npm | 9+ |
| Git | 2.x |
| macOS | 当前 Electron 打包配置优先面向 macOS |

### 1. 克隆并安装

```bash
git clone https://github.com/HuangYuChuh/Pokeshrimp.git
cd Pokeshrimp
npm install
```

### 2. 启动桌面应用

```bash
npm run dev
```

这个命令会先启动 Electron，Electron 再拉起本地 Next.js 开发服务器，端口是 `3099`。

### 3. 只启动 Web UI

```bash
npm run dev:web
```

### 4. 启动 CLI 模式

```bash
npm run cli
```

CLI 和桌面端共用同一套核心 Runtime、Skill 扫描逻辑和配置系统。

## 首次配置

开始聊天前，至少要配置一个模型提供商的 API Key。

### 方式 A：在桌面端里配置

打开应用后点击 `Settings`，保存 API Key 和默认模型即可。

### 方式 B：手动写配置文件

创建 `~/.visagent/config.json`：

```json
{
  "defaultModel": "claude-sonnet",
  "apiKeys": {
    "anthropic": "sk-ant-...",
    "openai": "sk-..."
  }
}
```

如果你只用 CLI，也可以直接用环境变量：

```bash
export ANTHROPIC_API_KEY="sk-ant-..."
export OPENAI_API_KEY="sk-..."
```

<a id="configuration"></a>

## 配置

Pokeshrimp 当前按下面的顺序加载配置：

1. `~/.visagent/config.json`
2. `<project>/.visagent/config.json`
3. `<project>/.visagent/config.local.json`

越靠后的文件优先级越高。

### 配置示例

```json
{
  "defaultModel": "claude-sonnet",
  "apiKeys": {
    "anthropic": "sk-ant-...",
    "openai": "sk-..."
  },
  "mcpServers": {
    "comfyui": {
      "command": "node",
      "args": ["./servers/comfyui.js"],
      "env": {},
      "transport": "stdio",
      "enabled": true
    }
  },
  "permissions": {
    "alwaysAllow": ["pwd", "ls *"],
    "alwaysDeny": ["rm -rf *"],
    "alwaysAsk": []
  }
}
```

### 当前磁盘路径

| 用途 | 路径 |
|------|------|
| 全局配置 | `~/.visagent/config.json` |
| 全局 Skills | `~/.visagent/skills/` |
| 项目配置 | `.visagent/config.json` |
| 项目本地覆盖 | `.visagent/config.local.json` |
| 项目 Skills | `.visagent/skills/` |
| 会话数据库 | `~/.pokeshrimp/data.db` |

注意：当前代码里，配置和 Skills 走的是 `.visagent`，SQLite 会话存储走的是 `.pokeshrimp`。这是仓库当前的真实实现，后续是否统一可以再调整。

<a id="skills"></a>

## Skills

Skill 是 Markdown 文件，用来教 Agent 如何使用某类工具或工作流。当前会从这两个目录扫描：

```bash
~/.visagent/skills/
.visagent/skills/
```

如果命令名相同，项目级 Skill 会覆盖全局 Skill。

### Skill 示例

```markdown
---
name: Remove Background
command: /remove-bg
description: Remove the background from an image with rembg
requiredTools:
  - run_command
inputParams:
  - name: input
    type: string
    description: Source image path
outputs:
  - type: image
    description: Background-removed PNG
---

Use `rembg` to remove the background from the input image.

Example:
`rembg i input.jpg output.png`
```

### 当前版本里 Skill 的作用

- 会被注入到系统提示词里
- 输入 `/` 时会出现在 Slash 命令候选里
- 帮助 Agent 发现可复用的工作流

当前版本里 Skill 还不会自动做到的事：

- 不会凭空注册新的可执行工具
- 不会绕过权限规则
- 不会替代真实存在的 CLI 或 MCP 后端

## 内置工具

默认 Runtime 目前暴露这四个内置工具：

| 工具 | 作用 |
|------|------|
| `read_file` | 读取本地文件 |
| `write_file` | 写入本地文件 |
| `list_directory` | 查看目录内容 |
| `run_command` | 执行 Shell 命令 |

这套工具已经足够支撑早期的文件型自动化和 CLI 编排。

## CLI 模式

运行：

```bash
npm run cli
```

示例：

```text
Pokeshrimp CLI v0.1.0
Human use GUI, Agent use CLI, Create use Pokeshrimp.

you > list files in this folder
pokeshrimp > I'll inspect the current directory first...
```

如果你想直接在终端里用 Pokeshrimp 的 Runtime，而不是打开桌面端，CLI 模式就很适合。

<a id="architecture"></a>

## 架构

### 运行时结构

```text
Electron shell
  -> Next.js app
  -> API routes
  -> agent runtime
  -> tool registry
  -> local filesystem / shell / future MCP servers
```

### 项目结构

```text
src/
├── app/                     # Next.js 页面和 API Routes
├── components/              # 桌面端 UI 组件
├── cli/                     # 终端入口
├── core/
│   ├── agent/               # Runtime 循环、中间件、sub-agent 骨架
│   ├── ai/                  # 模型提供商与工具桥接
│   ├── config/              # 配置 schema 与加载器
│   ├── hooks/               # Hook 执行基础设施
│   ├── mcp/                 # MCP client 和 adapter
│   ├── permission/          # 命令权限匹配
│   ├── session/             # SQLite 会话管理
│   ├── skill/               # Skill 解析与加载
│   └── tool/                # Tool 类型、注册表、执行器、内置工具
├── lib/                     # 供 UI / API Routes 复用的兼容层
└── hooks/                   # React hooks

electron/                    # Electron main / preload
```

### 技术栈

| 层 | 技术 |
|----|------|
| 桌面壳 | Electron |
| 前端 | Next.js 15 + React 19 |
| Agent Runtime | Vercel AI SDK |
| 模型提供商 | Anthropic + OpenAI |
| 持久化 | `better-sqlite3` + SQLite |
| 校验 | Zod |
| 语言 | TypeScript |

## 路线图

从当前代码形态来看，接下来的重点大致是：

- 把 MCP 工具完整接进默认 Runtime
- 把预览 / 输出 / 参数编辑面板接到真实创作结果上
- 完善桌面端的会话恢复和消息回放
- 把 Hooks 和自动化能力做成用户可操作的工作流
- 统一配置、存储和命名约定

## 参与贡献

欢迎贡献，尤其是下面这些方向：

- Skill 设计与可复用 `.skill.md` 示例
- MCP 集成与创作工具适配
- Electron / Next.js 产品体验打磨
- 文档和上手流程完善

基本开发流程：

```bash
git clone https://github.com/YOUR_USERNAME/Pokeshrimp.git
cd Pokeshrimp
npm install
npm run dev
```

提交 PR 前建议至少执行：

```bash
npm run build
npm run build:electron
```

## License

Apache License 2.0，详见 [LICENSE](./LICENSE)。
