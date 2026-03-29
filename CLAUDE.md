# Pokeshrimp

AI-powered image & video creative workstation — a super router for visual creation tools.

## Tech Stack

- **Desktop**: Electron (pure shell)
- **Frontend**: Next.js App Router + React + TypeScript
- **Styling**: Tailwind CSS v4
- **LLM**: Vercel AI SDK (multi-model support)
- **Tool Protocol**: MCP TypeScript SDK
- **Database**: SQLite via better-sqlite3
- **License**: Apache 2.0

## Architecture

Electron acts as a pure shell — all business logic runs in Next.js:
- `electron/` — Main process (window creation, Next.js server fork, preload)
- `src/app/` — Next.js App Router pages and API routes
- `src/components/` — React UI components
- `src/lib/` — Shared utilities, AI SDK setup, MCP client

## Development

```bash
npm run dev          # Start Next.js dev server (http://localhost:3000)
npm run dev:electron # Build & launch Electron shell
npm run build        # Build Next.js for production
npm run package      # Package as desktop app
```

## Conventions

- TypeScript strict mode everywhere
- Use `@/` path alias for imports from `src/`
- Components are client components (`"use client"`) unless explicitly server
- Keep Electron main process minimal — no business logic
- All AI/tool logic goes through Next.js API routes
