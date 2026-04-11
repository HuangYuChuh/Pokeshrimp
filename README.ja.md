<div align="center">

<!-- TODO: add banner image -->

<h1>Pokeshrimp</h1>

<p><strong>Humans use GUI, Agents use CLI, Creators use Pokeshrimp.</strong></p>

<p>画像・動画ワークフロー向けの AI デスクトップワークステーション。チャット中心の UI、ローカル Agent Runtime、Skill ベースの CLI オーケストレーションを、ひとつの編集可能なワークスペースにまとめます。</p>

<p>
  <a href="https://github.com/HuangYuChuh/Pokeshrimp/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-Apache%202.0-10B981?style=flat" alt="License" /></a>
  <a href="https://github.com/HuangYuChuh/Pokeshrimp/stargazers"><img src="https://img.shields.io/github/stars/HuangYuChuh/Pokeshrimp?style=flat&color=EAB308&logo=github" alt="Stars" /></a>
  <a href="https://github.com/HuangYuChuh/Pokeshrimp/network/members"><img src="https://img.shields.io/github/forks/HuangYuChuh/Pokeshrimp?style=flat&color=F97316&logo=github" alt="Forks" /></a>
  <a href="https://github.com/HuangYuChuh/Pokeshrimp/issues"><img src="https://img.shields.io/github/issues/HuangYuChuh/Pokeshrimp?style=flat&color=3B82F6" alt="Issues" /></a>
</p>

<p>
  <a href="#overview">Overview</a> ·
  <a href="#current-status">Current Status</a> ·
  <a href="#quick-start">Quick Start</a> ·
  <a href="#configuration">Configuration</a> ·
  <a href="#skills">Skills</a> ·
  <a href="#architecture">Architecture</a>
</p>

<p>
  <a href="./README.md">English</a> ·
  <a href="./README.zh-CN.md">简体中文</a> ·
  <a href="./README.zh-TW.md">繁體中文</a> ·
  <strong>日本語</strong>
</p>

</div>

---

<a id="overview"></a>

## Overview

Pokeshrimp の中心的な考え方はとてもシンプルです。

**人間がコマンドを暗記する必要はないが、Agent はコマンドを自在に使えるべきである。**

現在、多くの画像・動画ツールは CLI、API、ComfyUI ワークフロー、MCP Server を持っています。しかしそれらは別々に存在していることが多く、実際の制作フローは分断されがちです。Pokeshrimp はそれらの能力をローカルファーストなワークステーションにまとめることを目指しています。

- デスクトップアプリがチャット中心の体験を提供する
- Agent Runtime が意図を理解してツールを呼び出す
- Skill が Agent にツールやワークフローの使い方を教える
- すべての処理を、できるだけファイル・コマンド・構造化設定に落とし込み、編集・追跡・再利用しやすくする

このリポジトリは、完成したクリエイティブスイートというより、まだプロダクトの土台に近い状態です。デスクトップシェル、CLI、Skill 検出、セッション永続化、組み込みツール群はすでに存在します。一方で、より高度な MCP 連携、右側のクリエイティブパネル連動、自動化ワークフローはまだ実装途中です。

## Why This Project

画像・動画制作ツールは、ComfyUI、FFmpeg、rembg、ImageMagick、カスタム MCP Server、社内スクリプトなど、CLI や API を持つものが増えています。

これは強力ですが、同時に断片化も生みます。

- GUI ツールは人には使いやすいが、自動化しにくい
- 生の CLI ツールは Agent には扱いやすいが、多くの制作者には不親切
- クラウド型 Agent 製品は使いやすいが、実行レイヤーが見えにくい

Pokeshrimp はその間をつなぐ、デスクトップネイティブで検証可能なワークフローを目指しています。

- チャットで意図を伝える
- Skill でツール知識を蓄積する
- ローカル実行でファイル・モデル・コマンドを扱う
- GUI と CLI で同じ Runtime を共有する

<a id="current-status"></a>

## Current Status

このリポジトリで現在すでに実装されているもの：

| 項目 | 現在の状態 |
|------|------------|
| Desktop shell | Electron アプリがローカル Next.js フロントエンドを起動 |
| Chat UI | 会話 UI、モデル切替、設定ダイアログ、最近のセッションサイドバー |
| Agent runtime | Vercel AI SDK ベースのツール呼び出しループ |
| Built-in tools | `read_file`、`write_file`、`list_directory`、`run_command` |
| Skills | グローバル / プロジェクト単位の `.skill.md` 検出とスラッシュコマンド候補 |
| Persistence | SQLite によるセッションとメッセージ保存 |
| CLI mode | 同じコア Runtime を使うターミナル REPL |
| Config system | グローバル / プロジェクト / ローカル JSON 設定のマージ |

コードは存在するが、まだ実装途中として見るべきもの：

| 項目 | 補足 |
|------|------|
| MCP integration | client / adapter 層はあるが、デフォルト Runtime にはまだ完全に組み込まれていない |
| Preview / output workflow | Store と UI の足場はあるが、右側のクリエイティブインスペクタはまだ完全には接続されていない |
| Hooks / advanced automation | 設定スキーマと実行ヘルパーはあるが、まだ完成したユーザー向けワークフローではない |
| Permission UX | allow / deny の設定はあるが、完全な対話型承認 UI はまだない |

<a id="quick-start"></a>

## Quick Start

### Prerequisites

| Requirement | Version |
|------------|---------|
| Node.js | 20+ |
| npm | 9+ |
| Git | 2.x |
| macOS | 現在の Electron パッケージング構成では macOS を推奨 |

### 1. Clone and install

```bash
git clone https://github.com/HuangYuChuh/Pokeshrimp.git
cd Pokeshrimp
npm install
```

### 2. Start the desktop app

```bash
npm run dev
```

このコマンドはまず Electron を起動し、その後 Electron がローカルの Next.js 開発サーバーを `3099` 番ポートで起動します。

### 3. Or run the web UI only

```bash
npm run dev:web
```

### 4. Or run the CLI mode

```bash
npm run cli
```

CLI はデスクトップアプリと同じコア Runtime、Skill 読み込み、設定システムを共有します。

## First-Run Setup

Agent と対話を始める前に、少なくとも 1 つの API キーが必要です。

### Option A: Settings ダイアログを使う

デスクトップアプリを開き、`Settings` をクリックして API キーとデフォルトモデルを保存してください。

### Option B: 設定ファイルを手動で書く

`~/.visagent/config.json` を作成します。

```json
{
  "defaultModel": "claude-sonnet",
  "apiKeys": {
    "anthropic": "sk-ant-...",
    "openai": "sk-..."
  }
}
```

CLI のみ使う最小構成であれば、環境変数でも動作します。

```bash
export ANTHROPIC_API_KEY="sk-ant-..."
export OPENAI_API_KEY="sk-..."
```

<a id="configuration"></a>

## Configuration

Pokeshrimp は現在、以下の順序で設定を読み込みます。

1. `~/.visagent/config.json`
2. `<project>/.visagent/config.json`
3. `<project>/.visagent/config.local.json`

後ろのファイルほど優先されます。

### Example config

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

### Current on-disk paths

| Purpose | Path |
|---------|------|
| Global config | `~/.visagent/config.json` |
| Global skills | `~/.visagent/skills/` |
| Project config | `.visagent/config.json` |
| Project local override | `.visagent/config.local.json` |
| Project skills | `.visagent/skills/` |
| Session database | `~/.pokeshrimp/data.db` |

注意: 現在のコードベースでは、設定と Skills は `.visagent` を使い、SQLite セッション保存には `.pokeshrimp` を使っています。これは現時点の実装上の事実であり、将来的に統一される可能性はあります。

<a id="skills"></a>

## Skills

Skill は、特定のツールやワークフローの使い方を Agent に教える Markdown ファイルです。以下の場所から検出されます。

```bash
~/.visagent/skills/
.visagent/skills/
```

同じコマンド名の Skill がある場合、プロジェクト側がグローバル側を上書きします。

### Example skill

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
    description: Path to the source image
outputs:
  - type: image
    description: Background-removed PNG
---

Use `rembg` to remove the background from the input image.

Example:
`rembg i input.jpg output.png`
```

### 現在のアプリで Skill が担うこと

- システムプロンプトに読み込まれる
- `/` を入力したときにスラッシュコマンド候補に表示される
- Agent が再利用可能なワークフローを発見しやすくなる

ただし、現時点で Skill だけでは次のことはできません。

- 新しい実行可能コードを自動登録すること
- ツール権限を迂回すること
- 実在する CLI や MCP バックエンドの代わりになること

## Built-in Tools

デフォルト Runtime には現在、次の組み込みツールがあります。

| Tool | Purpose |
|------|---------|
| `read_file` | ファイルを読み取る |
| `write_file` | ファイルを書き込む |
| `list_directory` | ディレクトリ内容を確認する |
| `run_command` | シェルコマンドを実行する |

これだけでも、初期段階のファイルベース自動化と CLI オーケストレーションには十分です。

## CLI Mode

実行:

```bash
npm run cli
```

例:

```text
Pokeshrimp CLI v0.1.0
Human use GUI, Agent use CLI, Create use Pokeshrimp.

you > list files in this folder
pokeshrimp > I'll inspect the current directory first...
```

デスクトップシェルを開かずに Pokeshrimp Runtime を使いたい場合、CLI モードが便利です。

<a id="architecture"></a>

## Architecture

### Runtime layout

```text
Electron shell
  -> Next.js app
  -> API routes
  -> agent runtime
  -> tool registry
  -> local filesystem / shell / future MCP servers
```

### Source layout

```text
src/
├── app/                     # Next.js app router と API routes
├── components/              # デスクトップ UI コンポーネント
├── cli/                     # ターミナル入口
├── core/
│   ├── agent/               # Runtime ループ、ミドルウェア、sub-agent の土台
│   ├── ai/                  # モデル provider と AI ツールブリッジ
│   ├── config/              # 設定スキーマとローダー
│   ├── hooks/               # Hook 実行プリミティブ
│   ├── mcp/                 # MCP client と adapter 層
│   ├── permission/          # コマンド権限マッチング
│   ├── session/             # SQLite セッション管理
│   ├── skill/               # Skill パーサーとローダー
│   └── tool/                # Tool 型、registry、executor、built-ins
├── lib/                     # UI / API routes 向けの互換ラッパー
└── hooks/                   # React hooks

electron/                    # Electron main / preload
```

### Tech stack

| Layer | Technology |
|------|------------|
| Desktop shell | Electron |
| Frontend | Next.js 15 + React 19 |
| Agent runtime | Vercel AI SDK |
| Model providers | Anthropic + OpenAI |
| Persistence | SQLite via `better-sqlite3` |
| Validation | Zod |
| Language | TypeScript |

## Roadmap

現在のコードベースから見える近い将来の作業は次の通りです。

- MCP ツール登録をデフォルト Runtime に完全統合する
- preview / output / editor パネルを実際の生成結果に接続する
- デスクトップ UI のセッション復元とメッセージ再生を改善する
- hooks と自動化をユーザー向けワークフローとして公開する
- 設定、保存先、命名規則を整理・統一する

## Contributing

特に以下の分野でのコントリビューションを歓迎します。

- Skill 設計と再利用可能な `.skill.md` 例
- MCP 統合とクリエイティブツールの adapter
- Electron と Next.js のプロダクト品質向上
- ドキュメントと導入体験の改善

基本的な流れ:

```bash
git clone https://github.com/YOUR_USERNAME/Pokeshrimp.git
cd Pokeshrimp
npm install
npm run dev
```

PR を開く前の推奨チェック:

```bash
npm run build
npm run build:electron
```

## License

Apache License 2.0. See [LICENSE](./LICENSE).
