<div align="center">

<!-- TODO: 補上 banner 圖 -->

<h1>Pokeshrimp</h1>

<p><strong>Humans use GUI, Agents use CLI, Creators use Pokeshrimp.</strong></p>

<p>一個面向圖像與影片工作流程的 AI 桌面工作台，把對話式互動、本地 Agent Runtime、以及由 Skill 驅動的 CLI 編排放進同一個可編輯工作空間。</p>

<p>
  <a href="https://github.com/HuangYuChuh/Pokeshrimp/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-Apache%202.0-10B981?style=flat" alt="License" /></a>
  <a href="https://github.com/HuangYuChuh/Pokeshrimp/stargazers"><img src="https://img.shields.io/github/stars/HuangYuChuh/Pokeshrimp?style=flat&color=EAB308&logo=github" alt="Stars" /></a>
  <a href="https://github.com/HuangYuChuh/Pokeshrimp/network/members"><img src="https://img.shields.io/github/forks/HuangYuChuh/Pokeshrimp?style=flat&color=F97316&logo=github" alt="Forks" /></a>
  <a href="https://github.com/HuangYuChuh/Pokeshrimp/issues"><img src="https://img.shields.io/github/issues/HuangYuChuh/Pokeshrimp?style=flat&color=3B82F6" alt="Issues" /></a>
</p>

<p>
  <a href="#overview">概覽</a> ·
  <a href="#current-status">目前狀態</a> ·
  <a href="#quick-start">快速開始</a> ·
  <a href="#configuration">設定</a> ·
  <a href="#skills">Skills</a> ·
  <a href="#architecture">架構</a>
</p>

<p>
  <a href="./README.md">English</a> ·
  <a href="./README.zh-CN.md">简体中文</a> ·
  <strong>繁體中文</strong> ·
  <a href="./README.ja.md">日本語</a>
</p>

</div>

---

<a id="overview"></a>

## 概覽

Pokeshrimp 的核心想法很簡單：

**人不應該去背命令，但 Agent 應該能熟練呼叫命令。**

很多圖像與影片工具已經有 CLI、API、ComfyUI 工作流、MCP Server，但它們通常分散在不同地方，讓實際創作流程很割裂。Pokeshrimp 想做的是把這些能力放進一個本地優先的工作台裡：

- 桌面端負責對話式互動
- Agent Runtime 負責理解意圖與呼叫工具
- Skill 負責教 Agent 如何使用某類工具或工作流
- 整個流程盡量落到檔案、命令與結構化設定上，方便編輯、追蹤與重用

這個倉庫目前更接近一個「產品基礎骨架」，還不是已經完整打磨好的創作套件。桌面殼、CLI、Skill 掃描、會話持久化、內建工具鏈都已具備；更完整的 MCP 創作能力、右側創作面板聯動、以及自動化工作流仍在持續接線。

## 為什麼做這個專案

現在的創作工具通常有三個典型問題：

- 純 GUI 工具對人友善，但不利於自動化
- 純 CLI 工具適合 Agent 使用，但對大多數創作者不夠友善
- 雲端 Agent 產品容易上手，但執行層常常不透明，本地工作流也不容易重用

Pokeshrimp 想補上的就是中間這一層：

- 用對話描述需求
- 用 Skill 沉澱工具知識
- 用本地執行接管檔案、模型與命令
- 讓 GUI 與 CLI 共用同一套 Runtime

<a id="current-status"></a>

## 目前狀態

目前這個倉庫裡已經落地的部分：

| 模組 | 目前狀態 |
|------|----------|
| 桌面應用 | Electron 啟動本地 Next.js 介面 |
| 聊天介面 | 對話區、模型切換、設定彈窗、最近會話側邊欄 |
| Agent Runtime | 基於 Vercel AI SDK 的工具呼叫循環 |
| 內建工具 | `read_file`、`write_file`、`list_directory`、`run_command` |
| Skills | 支援全域與專案級 `.skill.md` 掃描，並在輸入 `/` 時提供提示 |
| 資料持久化 | SQLite 保存會話與訊息 |
| CLI 模式 | 終端 REPL，可重用同一套核心 Runtime |
| 設定系統 | 全域 / 專案 / 本地三層 JSON 設定合併 |

已經有程式碼骨架，但仍應視為「進行中」的部分：

| 模組 | 說明 |
|------|------|
| MCP 整合 | 已有 client / adapter 層，但預設執行鏈路裡還沒有完整註冊成可直接使用的工具 |
| 預覽 / 輸出面板 | Store 與元件已存在，但主畫面裡還沒有完整接上真實創作結果 |
| Hooks / 進階自動化 | Schema 與執行器已存在，但還不是完整的終端使用者工作流 |
| 權限審批體驗 | 設定層支援 allow / deny 規則，但還沒有完整的互動式審批 UI |

<a id="quick-start"></a>

## 快速開始

### 環境需求

| 依賴 | 版本 |
|------|------|
| Node.js | 20+ |
| npm | 9+ |
| Git | 2.x |
| macOS | 目前的 Electron 打包設定優先面向 macOS |

### 1. Clone 並安裝

```bash
git clone https://github.com/HuangYuChuh/Pokeshrimp.git
cd Pokeshrimp
npm install
```

### 2. 啟動桌面應用

```bash
npm run dev
```

這個命令會先啟動 Electron，接著由 Electron 拉起本地 Next.js 開發伺服器，埠號是 `3099`。

### 3. 只啟動 Web UI

```bash
npm run dev:web
```

### 4. 啟動 CLI 模式

```bash
npm run cli
```

CLI 與桌面端共用同一套核心 Runtime、Skill 掃描邏輯與設定系統。

## 首次設定

開始聊天前，至少需要設定一個模型提供商的 API Key。

### 方式 A：在桌面端裡設定

打開應用後點擊 `Settings`，儲存 API Key 與預設模型即可。

### 方式 B：手動撰寫設定檔

建立 `~/.visagent/config.json`：

```json
{
  "defaultModel": "claude-sonnet",
  "apiKeys": {
    "anthropic": "sk-ant-...",
    "openai": "sk-..."
  }
}
```

如果你只使用 CLI，也可以直接透過環境變數：

```bash
export ANTHROPIC_API_KEY="sk-ant-..."
export OPENAI_API_KEY="sk-..."
```

<a id="configuration"></a>

## 設定

Pokeshrimp 目前會依照下面順序載入設定：

1. `~/.visagent/config.json`
2. `<project>/.visagent/config.json`
3. `<project>/.visagent/config.local.json`

越後面的檔案優先級越高。

### 設定範例

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

### 目前磁碟路徑

| 用途 | 路徑 |
|------|------|
| 全域設定 | `~/.visagent/config.json` |
| 全域 Skills | `~/.visagent/skills/` |
| 專案設定 | `.visagent/config.json` |
| 專案本地覆蓋 | `.visagent/config.local.json` |
| 專案 Skills | `.visagent/skills/` |
| 會話資料庫 | `~/.pokeshrimp/data.db` |

注意：目前程式碼裡，設定與 Skills 走的是 `.visagent`，SQLite 會話儲存走的是 `.pokeshrimp`。這是倉庫目前的真實實作，之後是否統一可以再調整。

<a id="skills"></a>

## Skills

Skill 是 Markdown 檔案，用來教 Agent 如何使用某類工具或工作流。目前會從這兩個目錄掃描：

```bash
~/.visagent/skills/
.visagent/skills/
```

如果命令名稱相同，專案級 Skill 會覆蓋全域 Skill。

### Skill 範例

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

### 目前版本裡 Skill 的作用

- 會被注入到系統提示詞中
- 輸入 `/` 時會出現在 Slash 指令候選裡
- 幫助 Agent 發現可重用的工作流

目前版本裡 Skill 還不會自動做到的事：

- 不會直接註冊新的可執行工具
- 不會繞過權限規則
- 不會取代真實存在的 CLI 或 MCP 後端

## 內建工具

預設 Runtime 目前暴露這四個內建工具：

| 工具 | 作用 |
|------|------|
| `read_file` | 讀取本地檔案 |
| `write_file` | 寫入本地檔案 |
| `list_directory` | 查看目錄內容 |
| `run_command` | 執行 Shell 命令 |

這套工具已經足夠支撐早期的檔案型自動化與 CLI 編排。

## CLI 模式

執行：

```bash
npm run cli
```

範例：

```text
Pokeshrimp CLI v0.1.0
Human use GUI, Agent use CLI, Create use Pokeshrimp.

you > list files in this folder
pokeshrimp > I'll inspect the current directory first...
```

如果你想直接在終端裡使用 Pokeshrimp 的 Runtime，而不是打開桌面端，CLI 模式就很適合。

<a id="architecture"></a>

## 架構

### 執行時結構

```text
Electron shell
  -> Next.js app
  -> API routes
  -> agent runtime
  -> tool registry
  -> local filesystem / shell / future MCP servers
```

### 專案結構

```text
src/
├── app/                     # Next.js 頁面與 API Routes
├── components/              # 桌面端 UI 元件
├── cli/                     # 終端入口
├── core/
│   ├── agent/               # Runtime 循環、中介層、sub-agent 骨架
│   ├── ai/                  # 模型提供商與工具橋接
│   ├── config/              # 設定 schema 與載入器
│   ├── hooks/               # Hook 執行基礎設施
│   ├── mcp/                 # MCP client 與 adapter
│   ├── permission/          # 命令權限匹配
│   ├── session/             # SQLite 會話管理
│   ├── skill/               # Skill 解析與載入
│   └── tool/                # Tool 型別、註冊表、執行器、內建工具
├── lib/                     # 供 UI / API Routes 共用的相容層
└── hooks/                   # React hooks

electron/                    # Electron main / preload
```

### 技術棧

| 層 | 技術 |
|----|------|
| 桌面殼 | Electron |
| 前端 | Next.js 15 + React 19 |
| Agent Runtime | Vercel AI SDK |
| 模型提供商 | Anthropic + OpenAI |
| 持久化 | `better-sqlite3` + SQLite |
| 校驗 | Zod |
| 語言 | TypeScript |

## 路線圖

從目前程式碼的形態來看，接下來的重點大致是：

- 把 MCP 工具完整接進預設 Runtime
- 把預覽 / 輸出 / 參數編輯面板接到真實創作結果上
- 完善桌面端的會話恢復與訊息回放
- 把 Hooks 與自動化能力做成使用者可操作的工作流
- 統一設定、儲存與命名約定

## 參與貢獻

歡迎貢獻，尤其是下面這些方向：

- Skill 設計與可重用 `.skill.md` 範例
- MCP 整合與創作工具適配
- Electron / Next.js 產品體驗打磨
- 文件與上手流程完善

基本開發流程：

```bash
git clone https://github.com/YOUR_USERNAME/Pokeshrimp.git
cd Pokeshrimp
npm install
npm run dev
```

提交 PR 前建議至少執行：

```bash
npm run build
npm run build:electron
```

## License

Apache License 2.0，詳見 [LICENSE](./LICENSE)。
