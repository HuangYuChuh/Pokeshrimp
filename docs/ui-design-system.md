# Pokeshrimp — UI/UX Design System

> Last updated: 2026-04-14 | Status: Active reference

---

## 1. Design Principles

Aligned with the product philosophy in docs/00:

| Principle | What it means for UI |
|---|---|
| **Conversation drives everything** | One input box is the primary interaction. No feature buttons, no menus, no toolbars. The chat IS the product. |
| **Agent does the work, user keeps control** | Show what the Agent is doing (tool cards, approval prompts), but don't overwhelm with details. Expandable disclosure for power users. |
| **Minimal chrome, maximum canvas** | Sidebar and preview panel collapse when not needed. The chat area gets all available space. |
| **Dark-first, warm neutral** | Inspired by Claude Desktop. Dark mode as default, warm undertones (oklch hue 60), never pure black. |
| **Creators, not coders** | Every label, button, and interaction should make sense to a designer or content creator. No jargon. |

---

## 2. Color System

Built on CSS custom properties using oklch color space. Defined in `src/app/globals.css`.

### Semantic tokens (HeroUI v3)

| Token | Tailwind class | Usage |
|---|---|---|
| `--background` | `bg-background` | Page background |
| `--foreground` | `text-foreground` | Primary text |
| `--surface` | `bg-surface` | Card surfaces (input area, tool cards, settings dialog) |
| `--surface-secondary` | `bg-surface-secondary` | Sidebar, secondary panels |
| `--muted` | `text-muted`, `bg-muted` | Secondary text, subtle backgrounds |
| `--primary` | `bg-primary`, `text-primary` | Primary actions, user message bubbles |
| `--danger` | `text-danger`, `bg-danger` | Errors, delete actions, destructive |
| `--border` | `border-border` | Borders, separators |
| `--focus` | `ring-focus` | Focus rings |

### Rules
- Never use hardcoded hex/rgb colors in components. Always use semantic tokens via Tailwind: `bg-background`, `text-foreground`, `border-border`, etc.
- `--surface` is for elevated surfaces (input box, tool cards, settings dialog). Don't use `--background` for cards.
- `--muted` is for secondary text and subtle interactive states (hover backgrounds, disabled surfaces).
- Destructive actions (delete, deny) always use `--danger` color family (not `--destructive`).
- Green for success: use `text-green-400` / `text-green-500` (not a semantic token — these are rare enough to use Tailwind colors directly).

---

## 3. Typography

| Element | Size | Weight | Line height | Class |
|---|---|---|---|---|
| Page title | 28px | 600 (semibold) | 1.2 | `text-[28px] font-semibold` |
| Section heading | 15px | 600 | 1.4 | `text-[15px] font-semibold` |
| Body text | 14px | 400 | 1.75 (28px) | `text-[14px] leading-7` |
| Small text | 13px | 400-500 | 1.4 | `text-[13px]` |
| Caption / hint | 12px | 400 | 1.4 | `text-[12px] text-muted` |
| Micro label | 11px | 500 | 1.3 | `text-[11px] font-medium` |
| Code (inline) | 13px | 400 | — | `font-mono text-[13px]` |
| Code (block) | 13px | 400 | relaxed | `font-mono text-[13px] leading-relaxed` |

### Rules
- Use explicit pixel sizes (`text-[14px]`) instead of Tailwind's `text-sm`/`text-base` scale. This keeps precise control in a desktop app context.
- Agent responses use Tailwind Typography (`prose prose-sm dark:prose-invert`) for markdown rendering.
- User messages are always plain text, never markdown.
- Monospace font: system default (`font-mono` in Tailwind). No custom code font.

---

## 4. Spacing & Layout

### Three-panel layout

```
┌──────────┬────────────────────────┬──────────┐
│ Sidebar  │      Chat Panel        │ Preview  │
│  260px   │     flex-1 (fluid)     │  380px   │
│          │                        │          │
│ collapse │   max-w-[680px]        │ collapse │
│ <1200px  │   centered content     │ <1000px  │
└──────────┴────────────────────────┴──────────┘
```

### Breakpoints

| Width | Behavior |
|---|---|
| 1400px+ | All three panels visible |
| 1200px | Sidebar auto-collapses, toggle button appears |
| 1000px | Preview panel auto-collapses |
| 640px | Chat uses full width, tighter padding |

### Spacing scale
- Use Tailwind's default spacing: `px-3` (12px), `px-4` (16px), `px-5` (20px), `px-6` (24px)
- Consistent gaps: `gap-2` (8px) for tight groups, `gap-3` (12px) for related items, `gap-5` (20px) for sections
- Vertical rhythm in chat: `mb-6` between messages

### macOS traffic lights
- Title bar height: 52px (`h-13`)
- Traffic light position: `{ x: 12, y: 16 }` (set in Electron)
- All panels reserve this top space with a `drag h-13 shrink-0` div

---

## 5. Component Patterns

### Buttons

| Variant | Usage | Example |
|---|---|---|
| `primary` | Primary action (Send, Save) | Solid background, white text |
| `outline` | Secondary action (Cancel, Always Allow) | Border, transparent background |
| `ghost` | Tertiary action (sidebar items, toggles) | No border, hover background |
| `danger` | Dangerous action (Deny, Delete) | Red border/text |

Size: `size="sm"` for most UI. `size="icon"` for icon-only buttons (close, toggle). Always add `type="button"` to prevent form submission.

### Cards

Two patterns:
1. **Tool invocation card** — shows tool name, status dot, expandable input/output
2. **Approval card** — shows command, risk level, action buttons

Both use: `rounded-xl border border-border bg-surface px-3 py-2` base, expandable content below.

### Input areas

The chat input follows a unique pattern:
- Outer: `rounded-2xl border border-border bg-surface shadow-sm`
- Inner textarea: no border, transparent background, auto-resize
- Bottom row: model selector (left), send button (right)
- Slash command popup: `absolute bottom-full` positioned above

### Dialogs

Settings dialog pattern: full-screen overlay (`bg-black/60`) + centered card (`rounded-2xl max-w-[480px]`). Close on backdrop click or Escape.

### Sidebar items

Session list items: `rounded-lg px-3 py-1.5 text-[13px]`. Active state: `bg-surface-secondary`. Hover: `bg-surface-secondary/50`. Delete button visible on group-hover.

---

## 6. Interaction Patterns

### Loading states
- **Chat streaming**: Skeleton pulse (`<Skeleton>` component) while waiting for first token
- **Tool execution**: Yellow pulsing dot on tool card, green dot when complete
- **Settings save**: Button text changes to "Saving..." → "Saved!"
- **Approval pending**: Buttons in approval card, 60s countdown implicit

### Error states
- **API errors**: Red banner below chat messages with error text
- **Tool errors**: Red text in expanded tool card result
- **Approval errors**: Red text below approval buttons
- **Empty API key**: 401 → Settings prompt

### Empty states
- **No messages**: Centered greeting ("What would you like to create?")
- **No sessions**: Empty sidebar (just "New task" button)
- **No preview**: "Generated content will appear here"
- **No output files**: "Output files will appear here"

### Transitions
- Panel collapse: `transition-all duration-200` on width
- Hover reveals: `opacity-0 group-hover:opacity-100 transition-opacity`
- Theme switch: instant (no transition on color change)

---

## 7. File & Naming Conventions

### Component files
- One component per file: `approval-card.tsx`, `chat-panel.tsx`
- kebab-case filenames, PascalCase component names
- All components are `"use client"` unless explicitly server components
- Custom hooks in `src/hooks/`: `use-keyboard-shortcuts.ts`, `use-mobile.ts`

### HeroUI components
- Use `@heroui/react` components directly — no wrapper layer needed
- Semantic color tokens: `bg-surface`, `text-muted`, `text-danger`, `bg-surface-secondary`, `ring-focus`
- Custom components live in `src/components/` (kebab-case files, PascalCase exports)

### CSS
- Tailwind utility classes only. No custom CSS except in `globals.css` for app-level resets.
- No CSS modules, no styled-components, no emotion.
- For complex component styles, use `cn()` utility from `src/lib/utils.ts` (clsx + tailwind-merge).

### Icons
- Use `lucide-react` exclusively. No other icon libraries.
- Import individual icons: `import { ArrowUp, ChevronDown } from "lucide-react"`
- Default size: `size={15}` with `strokeWidth={1.5}` for sidebar, `strokeWidth={2}` for actions

---

## 8. Accessibility Checklist

Every new component must satisfy:

- [ ] Interactive elements use `<button>` (not `<div onClick>`) with `type="button"`
- [ ] Focus states visible: `focus:ring-1 focus:ring-focus` or `focus:outline-none focus-visible:ring-2`
- [ ] Keyboard navigable: Enter/Space to activate, Escape to close
- [ ] Color is not the only indicator (add icons or text alongside color-coded status)
- [ ] Images have `alt` text (even if empty for decorative images: `alt=""`)
- [ ] Sufficient contrast: `--muted` text on `--background` passes WCAG AA

---

## 9. Do's and Don'ts

| Do | Don't |
|---|---|
| Use semantic color tokens | Hardcode hex/rgb values |
| Use explicit pixel font sizes | Use Tailwind text-sm/text-base |
| Add `type="button"` on every button | Leave buttons without type |
| Use `cn()` for conditional classes | String concatenation for classes |
| Show loading/error/empty states | Leave blank screens on async operations |
| Collapse to one column on mobile | Force horizontal scroll |
| Use lucide-react icons | Mix icon libraries |
| Keep chat input as the primary focus | Add feature buttons or toolbars |
