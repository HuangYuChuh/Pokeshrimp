import { generateText, type CoreMessage, type LanguageModel } from "ai";
import type { ToolResult } from "@/core/tool/types";
import { classifyCommand } from "@/core/permission/checker";

// ─── Middleware Interface ────────────────────────────────────
//
// Per docs/01 §3.2: middlewares are the only extension point.
// The runtime never inspects them — it just calls the runners
// at fixed lifecycle points.

export type MiddlewareAction =
  | { action: "continue"; input?: unknown }
  | { action: "deny"; reason: string }
  | { action: "skip" };

export interface ConversationStartContext {
  systemPrompt: string;
  messages: CoreMessage[];
}

export interface Middleware {
  name: string;
  /**
   * Called once at the start of AgentRuntime.run(). May rewrite the
   * system prompt or seed messages. Used by SkillInjectionMiddleware
   * (docs/01 §3.4).
   */
  onConversationStart?(
    ctx: ConversationStartContext,
  ): Promise<ConversationStartContext> | ConversationStartContext;
  /**
   * Called before each LLM call within the loop. Used by
   * ContextCompactionMiddleware (docs/01 §3.2 #4).
   */
  beforeLLMCall?(
    messages: CoreMessage[],
  ): Promise<CoreMessage[]> | CoreMessage[];
  /**
   * Called before each tool invocation. May rewrite input or deny.
   * Used by CommandApprovalMiddleware and LoopDetectionMiddleware.
   */
  before?(toolName: string, input: unknown): Promise<MiddlewareAction>;
  /**
   * Called after each tool invocation. Read-only — for logging.
   */
  after?(
    toolName: string,
    input: unknown,
    result: ToolResult,
  ): Promise<void>;
}

// ─── Runners ─────────────────────────────────────────────────

export async function applyConversationStartMiddlewares(
  middlewares: Middleware[],
  ctx: ConversationStartContext,
): Promise<ConversationStartContext> {
  let current = ctx;
  for (const mw of middlewares) {
    if (!mw.onConversationStart) continue;
    current = await mw.onConversationStart(current);
  }
  return current;
}

export async function applyBeforeLLMMiddlewares(
  middlewares: Middleware[],
  messages: CoreMessage[],
): Promise<CoreMessage[]> {
  let current = messages;
  for (const mw of middlewares) {
    if (!mw.beforeLLMCall) continue;
    current = await mw.beforeLLMCall(current);
  }
  return current;
}

export async function runMiddlewaresBefore(
  middlewares: Middleware[],
  toolName: string,
  input: unknown,
): Promise<{ allowed: boolean; input: unknown; reason?: string }> {
  let currentInput = input;
  for (const mw of middlewares) {
    if (!mw.before) continue;
    const result = await mw.before(toolName, currentInput);
    if (result.action === "deny") {
      return { allowed: false, input: currentInput, reason: result.reason };
    }
    if (result.action === "continue" && result.input !== undefined) {
      currentInput = result.input;
    }
    // "skip" → move to next middleware
  }
  return { allowed: true, input: currentInput };
}

export async function runMiddlewaresAfter(
  middlewares: Middleware[],
  toolName: string,
  input: unknown,
  result: ToolResult,
): Promise<void> {
  for (const mw of middlewares) {
    if (!mw.after) continue;
    await mw.after(toolName, input, result);
  }
}

// ─── Built-in: SkillInjection ────────────────────────────────

export interface SkillSummary {
  name: string;
  command: string;
  description: string;
}

/**
 * Build the markdown section listing available skills.
 * Exported separately so callers can build a prompt without using
 * the middleware (e.g. one-shot CLI).
 */
export function buildSkillPromptSection(skills: SkillSummary[]): string {
  if (skills.length === 0) return "";
  const lines = skills.map((s) => `- ${s.command}: ${s.description}`);
  return (
    `\n## Available Skills\n` +
    `Each skill teaches you how to use a specific CLI tool.\n` +
    `Use the \`read_skill\` tool to load full instructions before invoking one.\n\n` +
    `${lines.join("\n")}\n`
  );
}

/**
 * Per docs/01 §3.4: at the start of each conversation, inject the
 * skill name+description list into the system prompt. Full skill
 * bodies are loaded on demand via the read_skill tool.
 */
export function createSkillInjectionMiddleware(
  loadSkills: () => SkillSummary[] | Promise<SkillSummary[]>,
): Middleware {
  return {
    name: "SkillInjection",
    async onConversationStart(ctx) {
      const skills = await loadSkills();
      const section = buildSkillPromptSection(skills);
      return { ...ctx, systemPrompt: ctx.systemPrompt + section };
    },
  };
}

// ─── Built-in: CommandApproval ───────────────────────────────

/**
 * Per docs/01 §3.3: shell command risk analysis + tiered approval.
 * Delegates pattern matching to the permission module so there is a
 * single source of truth for command policy.
 *
 * Behavior:
 *   - "deny" → block the call with the policy reason
 *   - "allow" → pass through silently
 *   - "ask" → currently passes through (the user-prompt UI is a
 *     future phase). Logged so we can wire it later.
 */
export function createCommandApprovalMiddleware(config: {
  alwaysAllow: string[];
  alwaysDeny: string[];
  alwaysAsk?: string[];
}): Middleware {
  return {
    name: "CommandApproval",
    async before(toolName, input) {
      if (toolName !== "run_command") return { action: "continue" };
      const cmd = (input as { command?: string })?.command ?? "";

      const decision = classifyCommand(cmd, {
        alwaysAllow: config.alwaysAllow,
        alwaysDeny: config.alwaysDeny,
        alwaysAsk: config.alwaysAsk ?? [],
      });

      if (decision === "deny") {
        return {
          action: "deny",
          reason: `Command blocked by policy: ${cmd}`,
        };
      }
      // "ask" path is not yet wired to a user-facing prompt. We let
      // it through for now and rely on alwaysDeny to catch dangerous
      // commands. To be revisited when the approval UI lands.
      return { action: "continue" };
    },
  };
}

// ─── Built-in: LoopDetection ─────────────────────────────────

const LOOP_WINDOW = 6;

/**
 * Per docs/01 §3.2 #3: detect repeated tool calls to prevent
 * infinite loops. Counts occurrences of the same (tool, input)
 * within a sliding window so swapping a parameter doesn't bypass.
 */
export function createLoopDetectionMiddleware(
  maxRepeats: number = 3,
): Middleware {
  const history: string[] = [];

  return {
    name: "LoopDetection",
    async before(toolName, input) {
      const key = `${toolName}:${stableStringify(input)}`;
      history.push(key);
      if (history.length > LOOP_WINDOW * 4) history.shift();

      const window = history.slice(-LOOP_WINDOW);
      const occurrences = window.filter((h) => h === key).length;

      if (occurrences >= maxRepeats) {
        return {
          action: "deny",
          reason: `Loop detected: ${toolName} called ${occurrences} times with the same input within the last ${LOOP_WINDOW} tool calls`,
        };
      }
      return { action: "continue" };
    },
  };
}

// ─── Built-in: ContextCompaction ─────────────────────────────

export interface ContextCompactionConfig {
  /** Max total characters in the message history before compaction kicks in. */
  maxCharBudget?: number;
  /** Number of recent messages to keep verbatim. */
  keepRecent?: number;
  /**
   * Custom summarizer. If provided, it takes precedence over
   * `summarizerModel`. Return a plain-text synopsis of the given
   * messages.
   */
  summarize?: (messages: CoreMessage[]) => Promise<string>;
  /**
   * Fallback LLM-backed summarizer. Used when `summarize` is not
   * given. Accepts either a live `LanguageModel` or a thunk that
   * resolves one lazily (so callers can defer model construction
   * until API keys are actually available). Return/yield `undefined`
   * to opt out — compaction will then degrade to the placeholder
   * string.
   */
  summarizerModel?: LanguageModel | (() => LanguageModel | undefined);
}

/**
 * Per docs/01 §3.2 #4: 上下文超长时自动压缩.
 *
 * Strategy: when the serialized message history exceeds the budget,
 * everything older than the last `keepRecent` messages is replaced
 * with a single condensed system note. The condensation has three
 * modes, tried in order:
 *
 *   1. `config.summarize` — a caller-supplied async function. Wins
 *      if provided.
 *   2. `config.summarizerModel` — a `LanguageModel` (or lazy thunk
 *      returning one). We build a compact summarization prompt and
 *      call `generateText` from the `ai` package.
 *   3. Placeholder fallback — `"[N earlier messages omitted...]"`.
 *      Also used when modes 1 and 2 throw, so compaction can never
 *      crash the main runtime loop.
 *
 * Summaries are cached by `splitAt` so we don't re-summarize the
 * same prefix on every iteration.
 */
export function createContextCompactionMiddleware(
  config: ContextCompactionConfig = {},
): Middleware {
  const maxCharBudget = config.maxCharBudget ?? 80_000;
  const keepRecent = config.keepRecent ?? 6;
  let cachedSummary: { upTo: number; text: string } | null = null;

  const resolveModel = (): LanguageModel | undefined => {
    const m = config.summarizerModel;
    if (!m) return undefined;
    if (typeof m === "function") {
      try {
        return (m as () => LanguageModel | undefined)();
      } catch {
        return undefined;
      }
    }
    return m;
  };

  return {
    name: "ContextCompaction",
    async beforeLLMCall(messages) {
      const total = messages.reduce((acc, m) => acc + estimateChars(m), 0);
      if (total <= maxCharBudget) return messages;
      if (messages.length <= keepRecent) return messages;

      const splitAt = messages.length - keepRecent;
      const oldPart = messages.slice(0, splitAt);
      const recent = messages.slice(splitAt);

      const placeholder = `[${oldPart.length} earlier messages omitted to save context]`;
      let summary = placeholder;

      if (cachedSummary && cachedSummary.upTo === splitAt) {
        summary = cachedSummary.text;
      } else if (config.summarize) {
        try {
          summary = await config.summarize(oldPart);
          cachedSummary = { upTo: splitAt, text: summary };
        } catch {
          // Degrade to placeholder rather than crashing the loop.
          summary = placeholder;
        }
      } else {
        const model = resolveModel();
        if (model) {
          try {
            summary = await summarizeWithModel(model, oldPart);
            cachedSummary = { upTo: splitAt, text: summary };
          } catch {
            summary = placeholder;
          }
        }
      }

      const summaryMessage: CoreMessage = {
        role: "system",
        content: `[Earlier conversation summary]\n${summary}`,
      };
      return [summaryMessage, ...recent];
    },
  };
}

const SUMMARIZER_SYSTEM_PROMPT =
  "You are a conversation summarizer. Compress the following messages " +
  "into a brief synopsis preserving facts, decisions, file paths, and " +
  "tool outcomes. Output plain text only, no preamble.";

async function summarizeWithModel(
  model: LanguageModel,
  oldPart: CoreMessage[],
): Promise<string> {
  const transcript = serializeMessagesForSummary(oldPart);
  const result = await generateText({
    model,
    system: SUMMARIZER_SYSTEM_PROMPT,
    prompt: transcript,
  });
  const text = (result.text ?? "").trim();
  if (!text) {
    throw new Error("Summarizer returned empty text");
  }
  return text;
}

/**
 * Render messages as `role: content` lines for the summarizer. Tool
 * calls surface their name and a short argument preview; tool results
 * surface success/error plus a truncated payload. Long strings are
 * clipped so a runaway transcript can't blow up the summarizer call.
 */
function serializeMessagesForSummary(messages: CoreMessage[]): string {
  const lines: string[] = [];
  for (const m of messages) {
    lines.push(`${m.role}: ${renderContentForSummary(m.content)}`);
  }
  return lines.join("\n");
}

function renderContentForSummary(content: CoreMessage["content"]): string {
  if (typeof content === "string") return clip(content, 2_000);
  if (!Array.isArray(content)) return "";
  const parts: string[] = [];
  for (const part of content) {
    if (!part || typeof part !== "object") continue;
    const p = part as {
      type?: string;
      text?: unknown;
      toolName?: unknown;
      args?: unknown;
      result?: unknown;
      isError?: unknown;
    };
    if (p.type === "text" && typeof p.text === "string") {
      parts.push(clip(p.text, 2_000));
    } else if (p.type === "tool-call") {
      const name = typeof p.toolName === "string" ? p.toolName : "tool";
      parts.push(`<tool-call ${name}(${clip(safeJson(p.args), 300)})>`);
    } else if (p.type === "tool-result") {
      const name = typeof p.toolName === "string" ? p.toolName : "tool";
      const outcome = p.isError ? "error" : "ok";
      const payload =
        typeof p.result === "string" ? p.result : safeJson(p.result);
      parts.push(`<tool-result ${name} ${outcome}: ${clip(payload, 500)}>`);
    }
  }
  return parts.join(" ");
}

function clip(s: string, max: number): string {
  if (s.length <= max) return s;
  return s.slice(0, max) + `…(+${s.length - max} chars)`;
}

function safeJson(v: unknown): string {
  try {
    return JSON.stringify(v) ?? "";
  } catch {
    return "[unserializable]";
  }
}

function estimateChars(m: CoreMessage): number {
  if (typeof m.content === "string") return m.content.length;
  if (!Array.isArray(m.content)) return 0;
  let n = 0;
  for (const part of m.content) {
    if (!part || typeof part !== "object") continue;
    const p = part as { text?: unknown; result?: unknown };
    if (typeof p.text === "string") n += p.text.length;
    else if (typeof p.result === "string") n += p.result.length;
    else n += 80; // tool call args / structured result estimate
  }
  return n;
}

// ─── Helpers ─────────────────────────────────────────────────

function stableStringify(v: unknown): string {
  if (v === null || typeof v !== "object") return JSON.stringify(v) ?? "null";
  if (Array.isArray(v)) return "[" + v.map(stableStringify).join(",") + "]";
  const obj = v as Record<string, unknown>;
  const keys = Object.keys(obj).sort();
  return (
    "{" +
    keys
      .map((k) => JSON.stringify(k) + ":" + stableStringify(obj[k]))
      .join(",") +
    "}"
  );
}
