import type { ToolResult } from "@/core/tool/types";

// ─── Middleware Interface ────────────────────────────────────

export type MiddlewareAction =
  | { action: "continue"; input?: unknown }
  | { action: "deny"; reason: string }
  | { action: "skip" };

export interface Middleware {
  name: string;
  before?(toolName: string, input: unknown): Promise<MiddlewareAction>;
  after?(toolName: string, input: unknown, result: ToolResult): Promise<void>;
}

// ─── Middleware Runner ───────────────────────────────────────

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
 * Builds a system prompt section listing available skills.
 * Called once at conversation start, not per-tool-call.
 */
export function buildSkillPromptSection(skills: SkillSummary[]): string {
  if (skills.length === 0) return "";
  const lines = skills.map((s) => `- ${s.command}: ${s.description}`);
  return `\n## Available Skills\nType / followed by a skill name to use it:\n${lines.join("\n")}\n`;
}

// ─── Built-in: CommandApproval ───────────────────────────────

export function createCommandApprovalMiddleware(config: {
  alwaysAllow: string[];
  alwaysDeny: string[];
}): Middleware {
  return {
    name: "CommandApproval",
    async before(toolName, input) {
      if (toolName !== "run_command") return { action: "continue" };

      const cmd = (input as { command?: string })?.command ?? "";

      // Check deny list first
      for (const pattern of config.alwaysDeny) {
        if (matchGlob(cmd, pattern)) {
          return { action: "deny", reason: `Command blocked by policy: ${pattern}` };
        }
      }

      // Check allow list
      for (const pattern of config.alwaysAllow) {
        if (matchGlob(cmd, pattern)) {
          return { action: "continue" };
        }
      }

      // Default: allow (in future, could prompt user)
      return { action: "continue" };
    },
  };
}

// ─── Built-in: LoopDetection ─────────────────────────────────

export function createLoopDetectionMiddleware(maxRepeats: number = 3): Middleware {
  const history: string[] = [];

  return {
    name: "LoopDetection",
    async before(toolName, input) {
      const key = `${toolName}:${JSON.stringify(input)}`;
      history.push(key);

      // Count consecutive identical calls
      let repeats = 0;
      for (let i = history.length - 1; i >= 0; i--) {
        if (history[i] === key) repeats++;
        else break;
      }

      if (repeats >= maxRepeats) {
        return {
          action: "deny",
          reason: `Loop detected: ${toolName} called ${repeats} times with same input`,
        };
      }

      return { action: "continue" };
    },
  };
}

// ─── Helpers ─────────────────────────────────────────────────

function matchGlob(str: string, pattern: string): boolean {
  const regex = new RegExp(
    "^" + pattern.replace(/[.+^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*") + "$"
  );
  return regex.test(str);
}
