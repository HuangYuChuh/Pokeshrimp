# Pokeshrimp — Product Roadmap

> Last updated: 2026-04-12

## Core Framework

- [x] AgentRuntime class with explicit while loop
- [x] 5 built-in middlewares (SkillInjection, CommandApproval, Hooks, LoopDetection, ContextCompaction)
- [x] 10 builtin tools (read/write/list/run_command/read_skill/spawn_agent/read_designfile/rebuild_asset/mark_asset_built)
- [x] Skill system — two-stage loading (inject summary → load full body on demand)
- [x] Skill YAML parsing with `yaml` package + format reference doc
- [x] Sub-agent parallel execution (spawn_agent, depth=1, concurrent=3)
- [x] Interactive command approval (ask → approval card → Allow Once / Always Allow / Deny)
- [x] Event-driven hooks engine (8 named events, convention-over-config)
- [x] ContextCompaction with LLM summarizer (claude-haiku, three-level fallback)
- [x] Designfile system (asset DAG, dirty detection, version history, param diffing)
- [x] Three-level config merge (global > project > local)
- [x] Session persistence (SQLite — sessions, messages, tool_calls)
- [x] MCP module wired into runtime initialization
- [x] Path traversal guard on file tools
- [x] API input validation with Zod

## Auth & Security

- [x] Environment variable auto-detection (ANTHROPIC_API_KEY / OPENAI_API_KEY)
- [x] OpenAI OAuth PKCE login via Electron BrowserWindow
- [x] Browser-assisted API key setup for Anthropic
- [x] API key preflight check (fail fast with 401 instead of 10s timeout)
- [x] Command approval with 60s timeout auto-deny
- [x] Token refresh handling for OAuth sessions
- [x] Rate limiting on API routes

## CLI

- [x] CLI REPL entry point (bin/pokeshrimp.js)
- [x] Streaming text output in terminal
- [x] CLI argument parsing (--model, --cwd, --config flags)
- [x] Non-interactive mode (pipe input, get output)
- [x] `npx pokeshrimp init` project scaffolding

## Frontend / UI

- [x] Chat panel with streaming messages
- [x] Tool invocation cards (expandable, shows input/output)
- [x] Slash command menu (type `/` to see skills)
- [x] Inline approval cards (Allow Once / Always Allow / Deny)
- [x] Settings dialog (API keys, default model)
- [x] Session sidebar (create, select, delete)
- [x] Editor panel (shows last tool call arguments)
- [x] Output panel (lists detected generated files)
- [x] Dark / light / system theme toggle
- [x] First-message loading skeleton
- [x] **Markdown rendering** in agent responses (code blocks, bold, lists, tables)
- [x] Message edit / delete / regenerate
- [x] Image preview zoom + side-by-side comparison
- [x] Video playback in preview panel
- [x] Tool management UI (installed CLI status: available / needs login / not installed)
- [x] Drag-and-drop .skill.md import
- [x] Responsive layout for smaller windows
- [x] Keyboard shortcuts (new session, focus input, etc.)
- [x] File/image upload in chat input
- [ ] Designfile visual editor (dependency graph visualization)

## Skill Ecosystem

- [x] .skill.md format defined + reference doc
- [x] Two skill files shipped (comfyui, batch-remove-bg)
- [ ] **End-to-end skill verification** (run a real CLI tool through the full loop)
- [x] Skill pipeline composition (`/remove-bg → /upscale → /watermark`)
- [x] Skill template generator (`pokeshrimp create-skill`)
- [ ] Skill marketplace / community sharing (future)

## Designfile

- [x] YAML parser + Zod validation
- [x] Dependency graph (DAG) with topological sort
- [x] Build state tracking (.visagent/.state.json)
- [x] Version history with param diffing (.visagent/.history/)
- [x] Three tools: read_designfile, rebuild_asset, mark_asset_built
- [x] Content-addressable file storage (copy generated files into history)
- [x] Visual dependency graph in the UI
- [x] `designfile diff` — visual diff between asset versions
- [x] Watch mode — auto-rebuild on upstream change

## Testing & Quality

- [x] vitest framework with 77 tests across 6 files
- [x] Husky commit hooks (commitlint)
- [x] **Add vitest to CI** (GitHub Actions)
- [x] ESLint + Prettier configuration
- [ ] E2E tests (Playwright or Cypress)
- [x] Test coverage reporting

## Infrastructure & Distribution

- [x] Electron desktop app (macOS)
- [x] GitHub Actions CI (tsc + build + commitlint)
- [x] CI runs vitest
- [ ] Electron auto-update (electron-updater)
- [ ] Windows / Linux builds
- [ ] Homebrew formula / winget manifest
- [ ] Error monitoring (Sentry or similar)

## Standalone Projects

- [x] API-to-CLI planning document (docs/02, internal)
- [ ] API-to-CLI implementation (separate repo)
- [ ] ComfyUI CLI tool (separate repo, referenced by comfyui.skill.md)

---

To update this file: check off items as they're completed, add new items as they're planned. Keep the sections in this order.
