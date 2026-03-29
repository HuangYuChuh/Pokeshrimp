<p align="center">
  <h1 align="center">Pokeshrimp</h1>
  <p align="center">图像视频智能创作领域的超级 Router</p>
</p>

<p align="center">
  <a href="https://github.com/HuangYuChuh/Pokeshrimp/releases"><img src="https://img.shields.io/github/v/release/HuangYuChuh/Pokeshrimp?style=flat-square" alt="Release" /></a>
  <a href="https://github.com/HuangYuChuh/Pokeshrimp/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-Apache%202.0-blue?style=flat-square" alt="License" /></a>
  <a href="https://github.com/HuangYuChuh/Pokeshrimp"><img src="https://img.shields.io/github/stars/HuangYuChuh/Pokeshrimp?style=flat-square" alt="Stars" /></a>
</p>

<p align="center">
  <a href="./README.md">English</a>
</p>

<!-- TODO: 添加截图 -->
<!-- <p align="center"><img src="docs/screenshot.png" width="800" /></p> -->

---

## 为什么选择 Pokeshrimp？

当前 AI 图像视频工具迫使你做选择：**易用性**（Midjourney）、**完全控制**（ComfyUI）、还是**智能自动化**（Lovart）。你不应该只能选一个。

Pokeshrimp 是一个桌面端工作台，将三者优势合而为一 —— AI Agent 理解你的意图，智能路由到最合适的工具执行，同时保持所有产物可编辑、过程可透明、能力可扩展。

### 核心理念

- **自然语言驱动一切。** 用对话描述你想要什么，Agent 负责选择工具、构造 Prompt、编排执行。

- **产物皆可编辑。** 每个生成结果都附带可修改的"源码"——参数、Prompt、工作流 JSON、SVG 代码。修改后立即重新渲染。

- **能力皆为插件。** Pokeshrimp 本身不生产任何图像视频能力，通过 MCP Server 和 Skill 路由到最合适的工具。新模型出来了？社区写一个 MCP Server 接进来，产品一行代码不用改。

- **开放生态，共创共享。** 所有配置都是人可读的文件（Markdown、YAML、JSON），可被 Git 管理、可分享、可 Hack。产品的长期价值在社区贡献的 Skill 和 MCP Server 生态。

---

## 快速开始

### 环境要求

| 依赖 | 版本 |
|-----|------|
| Node.js | 20+ |
| npm | 9+ |
| Git | 2.x |

### 从源码安装

```bash
git clone https://github.com/HuangYuChuh/Pokeshrimp.git
cd Pokeshrimp
npm install
```

### 开发

```bash
# 启动 Next.js 开发服务器
npm run dev

# 启动 Electron 桌面壳（另开一个终端）
npm run dev:electron
```

### 构建

```bash
# 生产构建
npm run build

# 打包为桌面应用
npm run package
```

---

## 产品架构

Pokeshrimp 采用三层架构，职责清晰、解耦独立：

| 层级 | 职责 | 技术实现 |
|-----|------|---------|
| **用户界面层** | 渲染 UI、对话交互、预览与编辑 | Electron + Next.js + React + TypeScript |
| **Agent 核心层** | 意图理解、LLM 调用、工具路由、Skill 引擎 | Vercel AI SDK + MCP Client |
| **MCP 能力层** | 所有图像视频处理能力，标准化 MCP Server | MCP TypeScript SDK |

### Electron 纯壳架构

Electron 只做三件事：创建窗口、fork Next.js standalone server、Context Bridge。所有业务逻辑跑在 Next.js App Router 中，API Routes 作为后端。

### 三栏布局

| 面板 | 宽度 | 用途 |
|-----|------|------|
| 左侧边栏 | 260px | 任务历史、Skill 技能库、MCP 插件状态、模型切换 |
| 中间对话区 | 自适应 | 核心交互——消息、工具调用过程、结果缩略图 |
| 右侧预览/编辑 | 600px | 大图预览、参数编辑、工作流详情、输出文件管理 |

---

## 核心能力

### Agent 与交互

| 功能 | 说明 |
|------|------|
| 多模型支持 | Claude、GPT、Gemini、DeepSeek，一键切换 |
| 自然语言路由 | 描述意图，Agent 自动选择最合适的工具 |
| 可编辑产物 | 每个输出包含可修改的源码（参数、Prompt、SVG 等） |
| 会话持久化 | 长任务跨应用重启保持状态，完整历史可回溯 |

### 可扩展性

| 功能 | 说明 |
|------|------|
| MCP Server | 标准化协议封装图像视频能力 |
| Skill（Markdown） | 用 Markdown 文件定义多步骤创作工作流 |
| CLI Skill | 用 Markdown 文档教 Agent 使用命令行工具（ffmpeg、rembg、imagemagick） |
| Slash 命令 | 每个注册的 Skill 自动生成 `/命令`，快速调用 |
| Hooks | `post-generate`、`pre-export`、`on-approve` —— 关键事件触发自定义脚本 |

### 创作工作流

| 功能 | 说明 |
|------|------|
| Skill 管道 | 像 Unix 管道一样串联：`/remove-bg → /upscale → /watermark → /export` |
| Designfile | 声明式资产依赖图（类似 Makefile，用于品牌资产构建） |
| 版本管理 | 内容寻址的资产历史——回溯、diff、分叉探索 |
| 两级作用域 | 全局 Skill（`~/.pokeshrimp/skills/`）+ 项目级 Skill（`.pokeshrimp/skills/`） |

---

## MCP Server

### 内置规划

| Server | 能力 | 优先级 |
|--------|------|-------|
| comfyui-server | 对接本地 ComfyUI，运行自定义工作流 | P0 |
| image-gen-server | 云端图像生成 API（FLUX、SD 等） | P0 |
| bg-remove-server | 智能去背景（BiRefNet / RMBG-2.0） | P0 |
| filesystem-server | 读写本地文件系统 | P0 |
| web-search-server | 网页搜索（Brave Search API） | P0 |
| video-gen-server | 视频生成 API（可灵 / Runway 等） | P1 |
| ffmpeg-server | 视频剪辑、转码、合成、加字幕 | P1 |
| svg-editor-server | SVG 创建与编辑 | P1 |
| browser-server | 浏览器自动化，网页抓取 | P1 |
| image-upscale-server | 图像超分辨率放大 | P2 |

### 自定义 MCP Server

开发自定义 MCP Server 的门槛刻意保持极低：

1. 用 Node.js 或 Python 脚本，使用官方 MCP SDK
2. 定义 tool 函数
3. 在配置文件中添加一行 JSON
4. 重启即生效

---

## 技术选型

| 技术决策 | 选型 | 理由 |
|---------|------|------|
| 桌面框架 | Electron | JS/TS 全栈统一；社区成熟 |
| 前端框架 | React + TypeScript | 生态最大；Vercel AI SDK 官方支持 |
| LLM 调度层 | Vercel AI SDK | 模型无关；内置 MCP 集成 |
| 工具协议 | MCP TypeScript SDK | 行业标准；生态复用价值大 |
| 数据库 | SQLite | 轻量嵌入式；结构化查询 |
| 样式 | Tailwind CSS v4 | 原子化 CSS；快速迭代 |
| 开源协议 | Apache 2.0 | 专利保护；社区友好；与 MCP 生态对齐 |

---

## 项目结构

```
pokeshrimp/
├── electron/                # Electron 主进程
│   ├── main.ts              # 创建窗口、fork Next.js
│   └── preload.ts           # Context Bridge
├── src/
│   ├── app/                 # Next.js App Router
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   └── globals.css
│   └── components/          # React 组件
│       ├── sidebar.tsx
│       ├── chat-panel.tsx
│       └── preview-panel.tsx
├── CLAUDE.md                # AI 辅助开发的项目规范
├── LICENSE                  # Apache 2.0
├── package.json
└── tsconfig.json
```

---

## 路线图

### 阶段零 —— 核心假设验证
> 在不写产品代码的前提下，用 Claude Desktop + ComfyUI 在真实任务上验证"给足上下文 → Agent 调工具 → 高质量输出"这条路是否走得通。

### 阶段一 —— 最小可行产品（MVP）
- Electron + Next.js 桌面端基础框架
- 对话 UI + 图片预览 + 参数编辑
- 接入 Vercel AI SDK，支持 Claude
- MCP Client + 1 个核心 MCP Server（ComfyUI）+ 文件系统
- 第一个 Skill 实现
- 会话持久化（SQLite）

### 阶段二 —— 核心体验完善
- Slash Command + 完整 Skill 系统（全局/项目级）
- CLI Skill 机制
- 多模型切换
- 版本管理（历史对比、回溯）
- 更多 MCP Server

### 阶段三 —— 生态建设
- MCP Server 插件注册表与市场
- Designfile 引擎 + Skill 管道组合
- Hooks 机制
- 社区贡献流程
- 企业版探索

---

## 参与贡献

欢迎贡献！以下是快速上手方式：

```bash
# Fork 并克隆
git clone https://github.com/YOUR_USERNAME/Pokeshrimp.git
cd Pokeshrimp
npm install

# 开发
npm run dev

# 提交 PR 前先构建测试
npm run build
```

最简单的贡献方式：
- **编写 Skill** —— 用 Markdown 定义一个新的创作工作流
- **开发 MCP Server** —— 将图像视频工具封装为标准 MCP Server
- **报告 Bug** —— 提 Issue 并附上复现步骤
- **完善文档** —— 修正错误、补充示例、翻译文档

---

## 社区

- [GitHub Issues](https://github.com/HuangYuChuh/Pokeshrimp/issues) —— Bug 反馈与功能建议
- [GitHub Discussions](https://github.com/HuangYuChuh/Pokeshrimp/discussions) —— 提问与讨论

---

## 开源协议

Pokeshrimp 基于 [Apache License 2.0](./LICENSE) 开源。

Copyright 2026 科林 KELIN
