<p align="center">
  <h1 align="center">Pokeshrimp</h1>
  <p align="center">The Super Router for AI-Powered Image & Video Creation</p>
</p>

<p align="center">
  <a href="https://github.com/HuangYuChuh/Pokeshrimp/releases"><img src="https://img.shields.io/github/v/release/HuangYuChuh/Pokeshrimp?style=flat-square" alt="Release" /></a>
  <a href="https://github.com/HuangYuChuh/Pokeshrimp/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-Apache%202.0-blue?style=flat-square" alt="License" /></a>
  <a href="https://github.com/HuangYuChuh/Pokeshrimp"><img src="https://img.shields.io/github/stars/HuangYuChuh/Pokeshrimp?style=flat-square" alt="Stars" /></a>
</p>

<p align="center">
  <a href="./README.zh-CN.md">中文</a>
</p>

<!-- TODO: Add screenshot here -->
<!-- <p align="center"><img src="docs/screenshot.png" width="800" /></p> -->

---

## Why Pokeshrimp?

The current landscape of AI image and video tools forces you to choose: **ease of use** (Midjourney), **full control** (ComfyUI), or **smart automation** (Lovart). You shouldn't have to pick just one.

Pokeshrimp is a desktop workstation that combines all three — an AI Agent that understands your intent and intelligently routes tasks to the best tools, while keeping everything editable, transparent, and extensible.

### Core Principles

- **Natural language drives everything.** Describe what you want in plain language. The Agent handles tool selection, prompt engineering, and execution orchestration.

- **Everything is editable.** Every generated result comes with its "source code" — parameters, prompts, workflow JSON, SVG code. Modify and re-render instantly.

- **Every capability is a plugin.** Pokeshrimp produces nothing itself. It routes to the best tool via MCP Servers and Skills. New model dropped? Community writes an MCP Server, everyone gets access. Zero code changes.

- **Open ecosystem.** All configuration is human-readable files (Markdown, YAML, JSON) — Git-manageable, shareable, hackable. The long-term value is in the community-contributed Skills and MCP Servers, not our code.

---

## Quick Start

### Prerequisites

| Requirement | Version |
|------------|---------|
| Node.js | 20+ |
| npm | 9+ |
| Git | 2.x |

### Install from Source

```bash
git clone https://github.com/HuangYuChuh/Pokeshrimp.git
cd Pokeshrimp
npm install
```

### Development

```bash
# Start Next.js dev server
npm run dev

# Launch Electron shell (in another terminal)
npm run dev:electron
```

### Build

```bash
# Build for production
npm run build

# Package as desktop app
npm run package
```

---

## Architecture

Pokeshrimp uses a three-layer architecture with clear separation of concerns:

| Layer | Responsibility | Technology |
|-------|---------------|------------|
| **UI Layer** | Rendering, chat interface, preview & editing | Electron + Next.js + React + TypeScript |
| **Agent Core** | Intent understanding, LLM calls, tool routing, Skill engine | Vercel AI SDK + MCP Client |
| **MCP Capability Layer** | All image/video processing capabilities as standardized servers | MCP TypeScript SDK |

### Electron as Pure Shell

Electron only does three things: create the window, fork the Next.js standalone server, and provide Context Bridge. All business logic runs in Next.js App Router with API Routes as the backend.

### Three-Column Layout

| Panel | Width | Purpose |
|-------|-------|---------|
| Sidebar | 260px | Task history, Skill library, MCP status, model switching |
| Chat | Flex | Core interaction — messages, tool calls, result thumbnails |
| Preview/Edit | 600px | Image preview, parameter editing, workflow details, output management |

---

## Core Capabilities

### Agent & Interaction

| Feature | Description |
|---------|-------------|
| Multi-model support | Claude, GPT, Gemini, DeepSeek — switch with one click |
| Natural language routing | Describe your intent, Agent picks the right tools |
| Editable artifacts | Every output includes modifiable source (params, prompts, SVG, etc.) |
| Session persistence | Long tasks survive app restarts, with full history |

### Extensibility

| Feature | Description |
|---------|-------------|
| MCP Servers | Standardized protocol for image/video capabilities |
| Skills (Markdown) | Define multi-step creative workflows as readable Markdown files |
| CLI Skills | Teach the Agent to use command-line tools (ffmpeg, rembg, imagemagick) via Markdown docs |
| Slash Commands | Every registered Skill gets a `/command` for quick access |
| Hooks | `post-generate`, `pre-export`, `on-approve` — custom scripts at key events |

### Creative Workflows

| Feature | Description |
|---------|-------------|
| Skill Pipeline | Chain Skills like Unix pipes: `/remove-bg → /upscale → /watermark → /export` |
| Designfile | Declare asset dependency graphs (like Makefile for brand assets) |
| Version Control | Content-addressed asset history — rollback, diff, branch explorations |
| Two-tier Scoping | Global Skills (`~/.pokeshrimp/skills/`) + Project Skills (`.pokeshrimp/skills/`) |

---

## MCP Servers

### Built-in (Planned)

| Server | Capability | Priority |
|--------|-----------|----------|
| comfyui-server | Run custom ComfyUI workflows locally | P0 |
| image-gen-server | Cloud image generation APIs (FLUX, SD, etc.) | P0 |
| bg-remove-server | Intelligent background removal | P0 |
| filesystem-server | Local file system access | P0 |
| web-search-server | Web search via Brave Search API | P0 |
| video-gen-server | Video generation APIs (Kling, Runway, etc.) | P1 |
| ffmpeg-server | Video editing, transcoding, compositing | P1 |
| svg-editor-server | SVG creation and editing | P1 |
| browser-server | Browser automation, web scraping | P1 |
| image-upscale-server | Image super-resolution | P2 |

### Custom MCP Servers

Developing a custom MCP Server is intentionally simple:

1. Write a Node.js or Python script using the official MCP SDK
2. Define your tool functions
3. Add one line of JSON to the config file
4. Restart — done

---

## Tech Stack

| Decision | Choice | Why |
|----------|--------|-----|
| Desktop framework | Electron | JS/TS full-stack unity; mature ecosystem |
| Frontend | React + TypeScript | Largest ecosystem; Vercel AI SDK official support |
| LLM layer | Vercel AI SDK | Model-agnostic; built-in MCP integration |
| Tool protocol | MCP TypeScript SDK | Industry standard; massive ecosystem reuse |
| Database | SQLite | Lightweight embedded; structured queries |
| Styling | Tailwind CSS v4 | Utility-first; fast iteration |
| License | Apache 2.0 | Patent protection; community-friendly; MCP ecosystem aligned |

---

## Project Structure

```
pokeshrimp/
├── electron/                # Electron main process
│   ├── main.ts              # Window creation, Next.js server fork
│   └── preload.ts           # Context Bridge
├── src/
│   ├── app/                 # Next.js App Router
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   └── globals.css
│   └── components/          # React components
│       ├── sidebar.tsx
│       ├── chat-panel.tsx
│       └── preview-panel.tsx
├── CLAUDE.md                # Project conventions for AI-assisted dev
├── LICENSE                  # Apache 2.0
├── package.json
└── tsconfig.json
```

---

## Roadmap

### Phase 0 — Validate Core Hypothesis
> Before writing product code, validate "context in → Agent routes tools → quality output" using Claude Desktop + ComfyUI on real tasks.

### Phase 1 — MVP
- Electron + Next.js desktop shell
- Chat UI + image preview + parameter editing
- Vercel AI SDK with Claude support
- MCP Client + 1 core MCP Server (ComfyUI) + filesystem
- First Skill implementation
- Session persistence (SQLite)

### Phase 2 — Core Experience
- Slash Commands + full Skill system (global + project-level)
- CLI Skill mechanism
- Multi-model switching
- Version management (history, diff, rollback)
- More MCP Servers

### Phase 3 — Ecosystem
- MCP Server plugin registry & marketplace
- Designfile engine + Skill pipeline composition
- Hooks mechanism
- Community contribution workflow
- Enterprise edition exploration

---

## Contributing

We welcome contributions! Here's how to get started:

```bash
# Fork and clone
git clone https://github.com/YOUR_USERNAME/Pokeshrimp.git
cd Pokeshrimp
npm install

# Development
npm run dev

# Build and test before submitting PR
npm run build
```

The easiest ways to contribute:
- **Write a Skill** — Create a Markdown file that teaches the Agent a new creative workflow
- **Build an MCP Server** — Wrap an image/video tool as a standardized MCP Server
- **Report bugs** — Open an issue with steps to reproduce
- **Improve docs** — Fix typos, add examples, translate

---

## Community

- [GitHub Issues](https://github.com/HuangYuChuh/Pokeshrimp/issues) — Bug reports and feature requests
- [GitHub Discussions](https://github.com/HuangYuChuh/Pokeshrimp/discussions) — Questions and ideas

---

## License

Pokeshrimp is open source under the [Apache License 2.0](./LICENSE).

Copyright 2026 科林 KELIN
