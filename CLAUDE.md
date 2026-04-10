# Pokeshrimp

AI-powered image & video creative workstation — a CLI orchestrator for visual creation tools.

**Core philosophy**: Humans use GUI, Agent uses CLI. The Agent orchestrates image/video creation tools through their CLI interfaces.

## Design Principles

1. **Minimal + Extensible** — Least code, most flexibility. No heavy frameworks.
2. **CLI is the primary tool channel** — Image tools are called via shell commands, not MCP.
3. **Skill files are the ecosystem** — A .skill.md file teaches the Agent a new CLI tool. No code needed.
4. **Middleware is the extension point** — Core loop never changes. All behavior changes go through middleware.

## Tech Stack

- **Desktop**: Electron (pure shell)
- **Frontend**: Next.js App Router + React 19 + TypeScript
- **Styling**: shadcn/ui + Tailwind CSS v4
- **LLM**: Vercel AI SDK (multi-model support)
- **Agent**: Self-built AgentRuntime + Middleware Chain
- **Database**: SQLite via better-sqlite3
- **Schema Validation**: Zod
- **License**: Apache 2.0

## Architecture

**AgentRuntime + Middleware Chain** — inspired by Claude Code (loop), DeerFlow (middleware), OpenClaw (CLI approval).

- `src/core/agent/` — AgentRuntime (core loop), Middleware, Sub-agent
- `src/core/tool/` — Tool interface, Registry, Executor, Builtin tools (run_command etc.)
- `src/core/skill/` — Skill engine (.skill.md parsing + prompt injection)
- `src/core/permission/` — CLI command approval (allow/deny/ask)
- `src/core/config/` — Three-level config + Zod validation
- `src/core/session/` — SQLite persistence
- `src/core/ai/` — LLM provider abstraction
- `src/app/` — Next.js GUI (thin wrapper over core/)
- `src/lib/` — Compatibility shims
- `.visagent/skills/` — Skill files (the ecosystem)

**Frozen rules** (do not change):
1. Agent loop is ONE function: `AgentRuntime.run()`. No other loop mechanisms.
2. Extensions only through middleware. No business logic in the core loop.
3. CLI is the primary tool channel. No MCP servers for image tools.
4. New tool integration = write a .skill.md. No code required.
5. No Python dependencies. Full-stack TypeScript.
6. `src/core/` MUST NOT import `next`, `react`, or `electron`.

See [docs/01-设计哲学与技术架构.md](docs/01-设计哲学与技术架构.md) for full technical architecture documentation (gitignored, internal only).

## Development

```bash
npm run dev          # Build Electron + launch desktop app (auto-starts Next.js)
npm run dev:web      # Start Next.js dev server only (http://localhost:3099)
npm run build        # Build Next.js for production
npm run package      # Package as macOS desktop app
```

## Conventions

- TypeScript strict mode everywhere
- Use `@/` path alias for imports from `src/`
- `src/core/` modules are parameterized (no hardcoded paths) and framework-agnostic
- `src/lib/` is a re-export layer — business logic belongs in `src/core/`
- `src/app/api/` routes are thin wrappers — call core/ functions, don't contain logic
- Components are client components (`"use client"`) unless explicitly server
- All external input validated with Zod schemas
- Config format defined in `src/core/config/schema.ts` (single source of truth)
- New tools must implement the `Tool` interface from `src/core/tool/types.ts`
- New skills are `.skill.md` files in `.visagent/skills/` or `~/.visagent/skills/`

## Workflow

**Never push directly to `main`.** All changes go through Pull Requests:

1. Create a feature branch: `git checkout -b feat/description`
2. Develop and commit (following commit convention below)
3. Push branch and open PR via `gh pr create`
4. CI runs automatically (TypeScript check + Next.js build + Electron build + commit lint)
5. Review and merge

**Branch naming**: `<type>/<short-description>` (e.g. `feat/tool-use-loop`, `fix/sidebar-overflow`, `refactor/core-config`)

**CI checks** (must all pass before merge):
- `npx tsc --noEmit` — TypeScript type check
- `npm run build` — Next.js production build
- `npm run build:electron` — Electron compilation
- Commit message lint (Conventional Commits)

## Git Commit Convention

Use **Conventional Commits** with scope:

```
<type>(<scope>): <description>
```

**Types**: `feat`, `fix`, `refactor`, `chore`, `docs`, `test`, `style`, `perf`

**Scopes** (match project modules):
- `core/tool`, `core/permission`, `core/hooks`, `core/config`, `core/mcp`, `core/skill`, `core/session`, `core/ai`
- `electron`, `ui`, `api`
- Omit scope for cross-cutting changes

**Examples**:
```
feat(core/tool): add unified Tool interface and registry
fix(electron): auto-start Next.js dev server
refactor(core): extract framework-agnostic core layer
docs(architecture): add technical architecture document
chore: update dependencies
```

**Rules**:
- Subject line < 70 characters, imperative mood, no period
- Body (optional): blank line after subject, explain "why" not "what"
- Footer: `Co-Authored-By: ...` when applicable
- One logical change per commit — don't mix features with refactors
