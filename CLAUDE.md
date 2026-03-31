# Pokeshrimp

AI-powered image & video creative workstation — a super router for visual creation tools.

## Tech Stack

- **Desktop**: Electron (pure shell)
- **Frontend**: Next.js App Router + React 19 + TypeScript
- **Styling**: CSS Variables + Tailwind CSS v4
- **LLM**: Vercel AI SDK (multi-model support)
- **Tool Protocol**: MCP TypeScript SDK
- **Database**: SQLite via better-sqlite3
- **Schema Validation**: Zod
- **License**: Apache 2.0

## Architecture

**Core + Shell** pattern — `src/core/` is framework-agnostic business logic, GUI and CLI are consumers.

- `src/core/` — Framework-agnostic core (Tool system, Permission, Hooks, Config, MCP, Skill, Session, AI)
- `src/app/` — Next.js App Router (thin API route wrappers over core/)
- `src/components/` — React client components (UI only)
- `src/lib/` — Compatibility shims (re-exports from core/ for API routes)
- `electron/` — Main process (window creation, Next.js server fork)
- `.visagent/` — Project-level config, skills, hooks (Git-managed)

**Key rule**: `src/core/` MUST NOT import `next`, `react`, or `electron`.

See [docs/architecture.md](docs/architecture.md) for full technical architecture documentation.

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
