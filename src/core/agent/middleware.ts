import type { CoreMessage } from "ai";
import type { ToolResult } from "@/core/tool/types";

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
 * deny patterns win over allow patterns. Unmatched commands fall
 * through to allow (the `ask` path lives in the permission module
 * and will be wired to a user prompt in a later phase).
 */
export function createCommandApprovalMiddleware(config: {
  alwaysAllow: string[];
  alwaysDeny: string[];
}): Middleware {
  return {
    name: "CommandApproval",
    async before(toolName, input) {
      if (toolName !== "run_command") return { action: "continue" };
      const cmd = (input as { command?: string })?.command ?? "";

      for (const pattern of config.alwaysDeny) {
        if (matchGlob(cmd, pattern)) {
          return {
            action: "deny",
            reason: `Command blocked by policy: ${pattern}`,
          };
        }
      }
      for (const pattern of config.alwaysAllow) {
        if (matchGlob(cmd, pattern)) return { action: "continue" };
      }
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
   * Optional summarizer. If omitted, older messages are replaced
   * with a placeholder (truncation only). Wire a real LLM-based
   * summarizer here for higher-quality compaction.
   */
  summarize?: (messages: CoreMessage[]) => Promise<string>;
}

/**
 * Per docs/01 §3.2 #4: 上下文超长时自动压缩.
 *
 * Strategy: when total characters exceed the budget, replace
 * everything older than the last `keepRecent` messages with a
 * single condensed system note.
 */
export function createContextCompactionMiddleware(
  config: ContextCompactionConfig = {},
): Middleware {
  const maxCharBudget = config.maxCharBudget ?? 80_000;
  const keepRecent = config.keepRecent ?? 6;
  let cachedSummary: { upTo: number; text: string } | null = null;

  return {
    name: "ContextCompaction",
    async beforeLLMCall(messages) {
      const total = messages.reduce((acc, m) => acc + estimateChars(m), 0);
      if (total <= maxCharBudget) return messages;
      if (messages.length <= keepRecent) return messages;

      const splitAt = messages.length - keepRecent;
      const oldPart = messages.slice(0, splitAt);
      const recent = messages.slice(splitAt);

      let summary: string;
      if (cachedSummary && cachedSummary.upTo === splitAt) {
        summary = cachedSummary.text;
      } else if (config.summarize) {
        summary = await config.summarize(oldPart);
        cachedSummary = { upTo: splitAt, text: summary };
      } else {
        summary = `[${oldPart.length} earlier messages omitted to save context]`;
      }

      const summaryMessage: CoreMessage = {
        role: "system",
        content: `[Earlier conversation summary]\n${summary}`,
      };
      return [summaryMessage, ...recent];
    },
  };
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

function matchGlob(str: string, pattern: string): boolean {
  const regex = new RegExp(
    "^" +
      pattern.replace(/[.+^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*") +
      "$",
  );
  return regex.test(str);
}

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
