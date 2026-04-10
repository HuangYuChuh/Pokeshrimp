<div align="center">

<!-- TODO: add banner image -->

<h1>Pokeshrimp</h1>

<p><strong>Humans use GUI, Agents use CLI, Creators use Pokeshrimp.</strong></p>

<p>An AI-powered desktop workstation for image and video creation workflows. It combines a desktop chat UI, a local agent runtime, and skill-based CLI orchestration into one editable workspace.</p>

<p>
  <a href="https://github.com/HuangYuChuh/Pokeshrimp/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-Apache%202.0-10B981?style=flat&logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IndoaXRlIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+PHBhdGggZD0iTTMgNmwzIDEuNSAzLTEuNSAzIDEuNSAzLTEuNSAzIDEuNVY0LjVMMyA0LjVWNnoiLz48L3N2Zz4=" alt="License" /></a>
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
  <strong>English</strong> · <a href="./README.zh-CN.md">中文</a>
</p>

</div>

---

<a id="overview"></a>

## Overview

Pokeshrimp is a local-first creative workstation built around one idea:

**humans should not need to memorize CLIs, but agents should be able to use them fluently.**

Instead of forcing users to jump between chat tools, ComfyUI graphs, shell commands, and desktop folders, Pokeshrimp puts an agent in the middle:

- the desktop app provides a chat-first interface
- the agent runtime decides which tools to call
- skills teach the agent how to use external tools
- every workflow stays editable because it is backed by files, commands, and structured config

The current repository is an early product foundation, not a fully finished creative suite. The desktop shell, agent runtime, session persistence, CLI mode, and skill discovery are already here. More advanced MCP-driven creative tooling is partially scaffolded and still being wired in.

## Why This Project

Image and video creation tools are increasingly exposing CLI and API surfaces: ComfyUI, FFmpeg, rembg, ImageMagick, custom MCP servers, and many internal scripts.

That is powerful, but fragmented:

- GUI tools are easier for humans but harder to automate
- raw CLI tools are easy for agents but unfriendly for most creators
- cloud agent products hide too much of the execution layer

Pokeshrimp is meant to bridge that gap with a desktop-native, inspectable workflow:

- chat to describe intent
- skills to encode tool knowledge
- local execution for files, models, and commands
- a shared runtime for GUI and CLI entry points

<a id="current-status"></a>

## Current Status

What is implemented in this repo today:

| Area | Current state |
|------|---------------|
| Desktop shell | Electron app that boots a local Next.js frontend |
| Chat UI | Conversation interface, model switcher, settings dialog, recent-session sidebar |
| Agent runtime | Vercel AI SDK based loop with middleware support |
| Built-in tools | `read_file`, `write_file`, `list_directory`, `run_command` |
| Skills | Global + project-level `.skill.md` discovery and slash command suggestions |
| Persistence | SQLite-backed sessions and messages |
| CLI mode | Terminal REPL using the same core agent runtime |
| Config system | Global, project, and local JSON config merge |

What exists but should still be treated as work in progress:

| Area | Notes |
|------|-------|
| MCP integration | Client and adapter layers exist, but MCP tools are not yet fully registered into the default runtime path |
| Preview / output workflow | Store and UI scaffolding exist, but the right-side creative inspector is not yet fully connected in the main screen |
| Hooks / advanced automation | Config schema and execution helpers exist, but this is not yet a finished end-user workflow |
| Permission UX | Allow/deny policy wiring exists in config, but there is no full interactive approval UI yet |

<a id="quick-start"></a>

## Quick Start

### Prerequisites

| Requirement | Version |
|------------|---------|
| Node.js | 20+ |
| npm | 9+ |
| Git | 2.x |
| macOS | Recommended for the current Electron packaging setup |

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

This starts Electron, and Electron launches the local Next.js development server on port `3099`.

### 3. Or run the web UI only

```bash
npm run dev:web
```

### 4. Or run the CLI mode

```bash
npm run cli
```

The CLI uses the same core runtime, skill loading, and config system as the desktop app.

## First-Run Setup

You need at least one API key before chatting with the agent.

### Option A: use the Settings dialog

Open the desktop app, click `Settings`, then save your API key and default model.

### Option B: write the config file manually

Create `~/.visagent/config.json`:

```json
{
  "defaultModel": "claude-sonnet",
  "apiKeys": {
    "anthropic": "sk-ant-...",
    "openai": "sk-..."
  }
}
```

Minimal CLI-only setup also works through environment variables:

```bash
export ANTHROPIC_API_KEY="sk-ant-..."
export OPENAI_API_KEY="sk-..."
```

<a id="configuration"></a>

## Configuration

Pokeshrimp currently loads configuration in this order:

1. `~/.visagent/config.json`
2. `<project>/.visagent/config.json`
3. `<project>/.visagent/config.local.json`

Later files override earlier ones.

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

Note: the current codebase uses `.visagent` for config/skills and `.pokeshrimp` for SQLite session storage. That split is intentional in the code today, even if it may be unified later.

<a id="skills"></a>

## Skills

Skills are Markdown files that teach the agent how to use specific workflows or tools. They are discovered from:

```bash
~/.visagent/skills/
.visagent/skills/
```

Project-level skills override global skills with the same command name.

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

### What skills do in the current app

- they are loaded into the system prompt
- they appear in slash-command suggestions when you type `/`
- they give the agent a structured way to discover reusable workflows

What they do not do yet by themselves:

- they do not automatically register custom executable code
- they do not bypass tool permissions
- they do not replace the need for an actual CLI or MCP backend

## Built-in Tools

The default runtime currently exposes these built-in tools:

| Tool | Purpose |
|------|---------|
| `read_file` | Read a file from disk |
| `write_file` | Write a file to disk |
| `list_directory` | Inspect directory contents |
| `run_command` | Execute a shell command |

These are enough for early file-based automation and CLI orchestration.

## CLI Mode

Run:

```bash
npm run cli
```

Example session:

```text
Pokeshrimp CLI v0.1.0
Human use GUI, Agent use CLI, Create use Pokeshrimp.

you > list files in this folder
pokeshrimp > I'll inspect the current directory first...
```

CLI mode is useful when you want the Pokeshrimp runtime without opening the desktop shell.

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
├── app/                     # Next.js app router and API routes
├── components/              # Desktop UI components
├── cli/                     # Terminal entry point
├── core/
│   ├── agent/               # Runtime loop, middleware, sub-agent scaffolding
│   ├── ai/                  # Model provider and AI tool bridge
│   ├── config/              # Config schema and loader
│   ├── hooks/               # Hook execution primitives
│   ├── mcp/                 # MCP client and adapter layer
│   ├── permission/          # Command permission matching
│   ├── session/             # SQLite session manager
│   ├── skill/               # Skill parser and loader
│   └── tool/                # Tool types, registry, executor, built-ins
├── lib/                     # Compatibility wrappers used by UI/API routes
└── hooks/                   # React hooks

electron/                    # Electron main/preload
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

Near-term work implied by the current codebase:

- finish MCP tool registration in the default runtime
- connect the preview/output/editor panel to real creative results
- improve session restore and message replay in the desktop UI
- expose hooks and automation in a user-facing workflow
- unify config, storage, and naming conventions

## Contributing

Contributions are welcome, especially in these areas:

- skill design and reusable `.skill.md` examples
- MCP integration and creative tool adapters
- Electron and Next.js product polish
- documentation and onboarding

Basic workflow:

```bash
git clone https://github.com/YOUR_USERNAME/Pokeshrimp.git
cd Pokeshrimp
npm install
npm run dev
```

Before opening a PR:

```bash
npm run build
npm run build:electron
```

## License

Apache License 2.0. See [LICENSE](./LICENSE).
