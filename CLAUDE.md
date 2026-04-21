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
- **Styling**: HeroUI v3 + Tailwind CSS v4
- **LLM**: Vercel AI SDK (multi-model support)
- **Agent**: Self-built AgentRuntime + Middleware Chain
- **Database**: SQLite via better-sqlite3
- **Schema Validation**: Zod
- **License**: Apache 2.0

## Frozen Rules

These are non-negotiable. No PR may violate them:

1. Agent loop is ONE function: `AgentRuntime.run()`. No other loop mechanisms.
2. Extensions only through middleware. No business logic in the core loop.
3. CLI is the primary tool channel. No MCP servers for image tools.
4. New tool integration = write a .skill.md. No code required.
5. No Python dependencies. Full-stack TypeScript.
6. `src/core/` MUST NOT import `next`, `react`, or `electron`.

## Directory Responsibilities

| Directory | Role | Rules |
|-----------|------|-------|
| `src/core/` | Framework-agnostic core | No framework imports; parameterized; all business logic here |
| `src/app/api/` | API routes | Thin wrappers: validate with Zod → call core/ → return response |
| `src/components/` | UI components | All `"use client"`; HeroUI + Tailwind; lucide-react icons only |
| `src/lib/` | Re-export layer | No business logic; max ~50 lines per file |
| `src/hooks/` | React hooks | `use-kebab-case.ts` naming |
| `src/cli/` | Terminal entry point | Shares core/ runtime with desktop app |
| `.visagent/skills/` | Skill files | `.skill.md` format |
| `.visagent/hooks/` | Hook scripts | Named by event (e.g. `post-generate`) |

## Module Quick Reference

| What you're writing | Where it goes |
|---------------------|---------------|
| New built-in tool | `src/core/tool/builtin/{name}.ts` implementing `Tool` interface |
| New middleware | `src/core/agent/middleware.ts` implementing `Middleware` interface |
| New API endpoint | `src/app/api/{module}/route.ts` (thin wrapper) |
| New UI component | `src/components/` or subdirectory |
| New React hook | `src/hooks/use-{name}.ts` |
| Config schema change | `src/core/config/schema.ts` |
| Test | `{module}/__tests__/{name}.test.ts` |

## Naming Conventions

| Object | Convention | Example |
|--------|-----------|---------|
| Files (all) | `kebab-case` | `approval-card.tsx`, `rate-limit.ts` |
| Components | `PascalCase` | `ChatPanel`, `ApprovalCard` |
| Functions/variables | `camelCase` | `getConfig()`, `sessionId` |
| Constants | `UPPER_SNAKE_CASE` | `SYSTEM_PROMPT` |
| Interfaces/types | `PascalCase` (no prefix) | `Tool`, `Middleware` |
| Zod schemas | `PascalCase` + `Schema` | `ChatRequestSchema` |
| Tool names | `snake_case` (for LLM) | `read_file`, `run_command` |
| Tool exports | `camelCase` + `Tool` | `readFileTool` |

## Code Rules

- TypeScript strict mode everywhere
- Use `@/` path alias for imports from `src/`
- All external input validated with Zod schemas (`.safeParse()`)
- Config format defined in `src/core/config/schema.ts` (single source of truth)
- Semantic color tokens only — no hardcoded colors (see [UI Design System](docs/ui-design-system.md))
- One component per file, one logical change per commit

## Git Commit Convention

Format: `<type>(<scope>): <description>`

**Types**: `feat`, `fix`, `refactor`, `chore`, `docs`, `test`, `style`, `perf`, `ci`, `revert`

**Scopes** (required):
- Core: `core`, `core/agent`, `core/tool`, `core/permission`, `core/hooks`, `core/config`, `core/mcp`, `core/skill`, `core/session`, `core/ai`, `core/designfile`, `core/http`
- App: `electron`, `ui`, `api`
- Eng: `architecture`, `conventions`, `ci`, `deps`

**Rules**: English, imperative mood, < 70 chars, no period, no Co-Authored-By

## Workflow

**Review Before Commit** — code enters git history as a finished product, not a work-in-progress:

```
Write code + tests → Karpathy Review (simplicity, necessity, surgical) → Codex Review (if large change) → fix all issues → verify all checks pass → commit
```

- Tests ship with the feature — not as an afterthought
- Review is the last step of coding, not a post-commit patch
- commit messages reflect the final deliverable (`feat`, not `fix` for review feedback)
- No noise commits (`fix lint`, `fix type error`) in git history

**Never commit**:
- `.env`, `credentials.json`, API keys
- `node_modules/`, `.next/`, `dist-electron/`, `dist-cli/`
- IDE configs (`.vscode/`, `.idea/`)
- OS files (`.DS_Store`, `Thumbs.db`)

**Never push directly to `main`.** All changes go through Pull Requests:

1. Create a feature branch: `git checkout -b feat/description`
2. Develop, review, and commit (following convention above)
3. Push branch and open PR via `gh pr create`
4. CI runs automatically
5. Squash and merge

**Branch naming**: `<type>/<short-description>` (e.g. `feat/tool-use-loop`, `fix/sidebar-overflow`)

**CI checks** (must all pass):
- `npx tsc --noEmit` — TypeScript
- `npm run lint` — ESLint
- `npm run format:check` — Prettier
- `npx vitest run --coverage` — Tests
- `npm run build` + `npm run build:electron` — Build
- Commit message lint (Conventional Commits)

**Pre-commit** (Husky + lint-staged):
- ESLint `--max-warnings 0` + Prettier on staged `*.{ts,tsx}`
- Electron TypeScript check

## Development

```bash
npm run dev          # Build Electron + launch desktop app (auto-starts Next.js)
npm run dev:web      # Start Next.js dev server only (http://localhost:3099)
npm run build        # Build Next.js for production
npm test             # Run vitest test suite
npm run package      # Package as macOS desktop app
```

## Detailed References

For comprehensive guides, see:

- [Coding Standards](docs/02-coding-standards.md) — full directory structure, module patterns, interfaces, test conventions
- [Contributing Guide](docs/03-contributing.md) — complete commit/PR/CI workflow with examples and troubleshooting
- [UI Design System](docs/ui-design-system.md) — color tokens, typography, spacing, component patterns
- [Product Vision](docs/00-产品定义与愿景.md) — product definition, user scenarios, business strategy
