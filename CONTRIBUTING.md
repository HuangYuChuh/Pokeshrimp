# Contributing to Pokeshrimp

Thank you for your interest in contributing! This guide covers everything you need to know.

## Getting Started

```bash
git clone https://github.com/HuangYuChuh/Pokeshrimp.git
cd Pokeshrimp
npm install
npm run dev:web    # Start Next.js dev server (http://localhost:3099)
npm run dev        # Or launch full Electron desktop app
```

Requirements: Node.js >= 20.17, npm >= 10

## Branch Strategy

Never push directly to `main`. All changes go through Pull Requests.

```
main                         ← Always buildable
feat/<short-description>     ← New feature
fix/<short-description>      ← Bug fix
refactor/<short-description> ← Refactoring
chore/<short-description>    ← Build/tooling
docs/<short-description>     ← Documentation
```

Branch names use **kebab-case** (lowercase + hyphens).

## Commit Convention

We use [Conventional Commits](https://www.conventionalcommits.org/) with **required scope**.

```
<type>(<scope>): <description>
```

### Types

`feat`, `fix`, `refactor`, `chore`, `docs`, `test`, `style`, `perf`, `ci`, `revert`

### Scopes

| Category | Scopes |
|----------|--------|
| Core | `core`, `core/agent`, `core/tool`, `core/permission`, `core/hooks`, `core/config`, `core/mcp`, `core/skill`, `core/session`, `core/ai`, `core/designfile`, `core/http` |
| App | `electron`, `ui`, `api` |
| Engineering | `architecture`, `conventions`, `ci`, `deps` |

### Rules

- English, imperative mood, lowercase first letter
- Under 70 characters, no period at end
- One logical change per commit

### Examples

```
feat(core/tool): add rebuild_asset tool
fix(electron): auto-start Next.js dev server
refactor(core): extract framework-agnostic core layer
docs(architecture): add technical architecture document
chore(deps): update dependencies
test(core/permission): add command risk classifier tests
```

## Pull Request Process

### 1. Create PR

```bash
git push -u origin feat/your-feature
gh pr create --title "feat(scope): description"
```

### 2. PR Description

```markdown
## Summary
<1-3 bullet points: what and why>

## Test plan
- [ ] `npm test` passes
- [ ] `npx tsc --noEmit` passes
- [ ] Manual verification of <specific behavior>
```

### 3. CI Must Pass

All checks must be green before merge:

| Check | Command |
|-------|---------|
| TypeScript | `npx tsc --noEmit` |
| ESLint | `npm run lint` |
| Prettier | `npm run format:check` |
| Tests | `npx vitest run --coverage` |
| Build | `npm run build && npm run build:electron` |
| Commit lint | Conventional Commits format |

### 4. Merge

We use **Squash and Merge** to keep main history linear and clean.

## Code Style

### Naming

| Object | Convention | Example |
|--------|-----------|---------|
| Files | `kebab-case` | `approval-card.tsx`, `rate-limit.ts` |
| Components | `PascalCase` | `ChatPanel`, `ApprovalCard` |
| Functions/variables | `camelCase` | `getConfig()`, `sessionId` |
| Constants | `UPPER_SNAKE_CASE` | `SYSTEM_PROMPT` |
| Interfaces/types | `PascalCase` (no prefix) | `Tool`, `Middleware` |
| Tool names (for LLM) | `snake_case` | `read_file`, `run_command` |

### Directory Rules

| Directory | Role |
|-----------|------|
| `src/core/` | Framework-agnostic core. **No imports from next/react/electron.** |
| `src/app/api/` | Thin wrappers: validate with Zod → call core/ → return response |
| `src/components/` | Client components. HeroUI + Tailwind. lucide-react icons only. |
| `src/lib/` | Re-export layer. No business logic. |
| `src/hooks/` | React hooks. `use-kebab-case.ts` naming. |

### Where to Put New Code

| What | Where |
|------|-------|
| New built-in tool | `src/core/tool/builtin/{name}.ts` |
| New middleware | `src/core/agent/middleware.ts` |
| New API endpoint | `src/app/api/{module}/route.ts` |
| New UI component | `src/components/` |
| New React hook | `src/hooks/use-{name}.ts` |
| Config change | `src/core/config/schema.ts` |
| Test | `{module}/__tests__/{name}.test.ts` |

## Testing

- Framework: **Vitest**
- Test location: `__tests__/` directories co-located with source
- Coverage scope: `src/core/**/*.ts` only
- Run tests: `npm test`
- Run with coverage: `npx vitest run --coverage`

### What to Test

- Core logic in `src/core/` (permission, config, designfile, tools)
- Middleware behavior (before/after hooks)
- CLI argument parsing

### What NOT to Test

- UI component rendering details
- API routes (covered through core/ tests)
- Re-export layers (`src/lib/`, `index.ts`)

## Pre-commit Hooks

Husky + lint-staged runs automatically on commit:

- **ESLint** `--max-warnings 0` on staged `*.{ts,tsx}`
- **Prettier** format check on staged `*.{ts,tsx}`
- **TypeScript** check for Electron code
- **commitlint** validates commit message format

If a hook fails:

```bash
npm run lint:fix       # Fix ESLint issues
npm run format         # Fix Prettier issues
npx tsc -p tsconfig.electron.json --noEmit  # Fix Electron types
```

## Architecture Rules (Frozen)

These rules are non-negotiable:

1. Agent loop is ONE function: `AgentRuntime.run()`.
2. Extensions only through middleware.
3. CLI is the primary tool channel for image tools.
4. New tool integration = write a `.skill.md` file.
5. No Python dependencies. Full-stack TypeScript.
6. `src/core/` must not import `next`, `react`, or `electron`.

## Questions?

Open an issue if anything is unclear. We're happy to help!
