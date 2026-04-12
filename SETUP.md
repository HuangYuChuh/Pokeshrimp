# Pokeshrimp — Setup Guide

Get the app running from a fresh clone in 5 minutes.

## Prerequisites

| Requirement | Version | Check |
|---|---|---|
| Node.js | 18+ | `node -v` |
| npm | 9+ | `npm -v` |
| Git | any | `git -v` |

Optional (for CLI tool testing):
- `rembg` — `pip install rembg[cli]` (background removal)
- `ffmpeg` — `brew install ffmpeg` (video processing)
- ComfyUI CLI — see project-specific instructions

## Quick Start

```bash
# 1. Clone
git clone https://github.com/HuangYuChuh/Pokeshrimp.git
cd Pokeshrimp

# 2. Install dependencies
npm install

# 3. Configure API key (pick one)

# Option A: environment variable (recommended for dev)
export ANTHROPIC_API_KEY=sk-ant-your-key-here
# or
export OPENAI_API_KEY=sk-your-key-here

# Option B: config file
mkdir -p ~/.visagent
echo '{ "apiKeys": { "anthropic": "sk-ant-your-key-here" } }' > ~/.visagent/config.json

# Option C: configure in the app (Settings dialog after launching)

# 4. Launch
npm run dev          # Electron desktop app (full GUI)
# or
npm run dev:web      # Next.js only (http://localhost:3099, no Electron)
```

## Development Commands

| Command | What it does |
|---|---|
| `npm run dev` | Build Electron + launch desktop app (auto-starts Next.js) |
| `npm run dev:web` | Start Next.js dev server only (port 3099) |
| `npm run build` | Next.js production build |
| `npm run build:electron` | Compile Electron TypeScript |
| `npm run build:cli` | Compile CLI entry point |
| `npm test` | Run vitest test suite (77 tests) |
| `npx tsc --noEmit` | TypeScript type check |
| `npx pokeshrimp` | Launch CLI REPL |

## Project Structure

```
.visagent/                 # Project-level config (Git-tracked)
├── skills/                # Skill files (.skill.md)
├── hooks/                 # Event hook scripts
├── config.json            # Project config (permissions, MCP servers)
├── config.local.json      # Local overrides (gitignored)
├── designfile.yaml        # Asset dependency graph
├── .state.json            # Build state (auto-generated)
└── .history/              # Version history (auto-generated)

~/.visagent/               # Global config (not Git-tracked)
├── config.json            # API keys, default model
└── skills/                # Global skills (shared across projects)
```

## Configuration

### Three-level config (highest priority wins)

1. `.visagent/config.local.json` — personal overrides, gitignored
2. `.visagent/config.json` — project-level, shared with team
3. `~/.visagent/config.json` — global defaults

### Example config

```json
{
  "defaultModel": "claude-sonnet",
  "apiKeys": {
    "anthropic": "sk-ant-...",
    "openai": "sk-..."
  },
  "permissions": {
    "alwaysAllow": ["comfyui-cli *", "ffmpeg *", "rembg *"],
    "alwaysDeny": ["rm -rf *", "sudo *"],
    "alwaysAsk": []
  },
  "mcpServers": {},
  "hooks": {}
}
```

### Permissions

Commands that match `alwaysAllow` patterns run without asking. Commands that match `alwaysDeny` are blocked. Everything else prompts the user with an approval card (Allow Once / Always Allow / Deny).

### Skills

Drop a `.skill.md` file in `.visagent/skills/` (project) or `~/.visagent/skills/` (global). The agent automatically discovers it. See `docs/skill-format.md` for the file format.

### Hooks

Drop an executable script in `.visagent/hooks/` named after an event:

```bash
# .visagent/hooks/post-generate
#!/bin/bash
# Auto-add watermark after image generation
INPUT=$(cat)  # JSON payload on stdin
echo '{}' # JSON response on stdout
```

Available events: `session-start`, `pre-tool-call`, `post-tool-call`, `post-generate`, `pre-export`, `on-error`, `on-approve`, `session-end`.

## Troubleshooting

**"API key not configured"** — Set `ANTHROPIC_API_KEY` env var or add it in Settings.

**Electron window is blank** — The Next.js dev server takes a few seconds to start. Wait for the terminal to show "Ready in Xs".

**`npx pokeshrimp` doesn't work** — Run `npm install` first so the bin entry is linked.

**MCP server fails to connect** — Check the server command in config. MCP failures are logged as warnings and don't crash the app.
