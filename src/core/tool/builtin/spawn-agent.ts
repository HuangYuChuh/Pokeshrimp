import { z } from "zod";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import type { LanguageModel } from "ai";
import type { Tool, ToolContext, ToolResult, PermissionResult } from "../types";
import { ToolRegistry } from "../registry";
import type { AgentRuntime } from "@/core/agent/runtime";

// ─── Concurrency limits (per docs/01 §3.5) ───────────────────

const MAX_CONCURRENT = 3;
const SUB_AGENT_MAX_ITERATIONS = 32;

let activeCount = 0;

// ─── Schema ──────────────────────────────────────────────────

const inputSchema = z.object({
  prompt: z.string().describe("The task description to delegate to the sub-agent"),
  toolWhitelist: z
    .array(z.string())
    .optional()
    .describe("Tool names the sub-agent may use. Defaults to all parent tools except spawn_agent."),
});

// ─── Factory ─────────────────────────────────────────────────

/**
 * Per docs/01 §3.5 / §5.2: the main agent invokes sub-agents via
 * a `spawn_agent` tool. Each sub-agent:
 *  - reuses the parent AgentRuntime class (not a different loop)
 *  - inherits the parent's middleware chain
 *  - gets a filtered tool registry (no spawn_agent → max depth = 1)
 *  - runs in an isolated working directory
 *  - has its own session id
 *
 * The factory closes over the parent runtime so the tool can call
 * `parent.spawnSubAgent(...)` without accessing global state.
 */
export function createSpawnAgentTool(parent: AgentRuntime): Tool {
  return {
    name: "spawn_agent",
    description:
      "Spawn an isolated sub-agent to handle a delegated task. Use this to parallelize independent work (e.g. generating multiple variations). The sub-agent has its own working directory and cannot spawn further sub-agents.",
    inputSchema,
    isBuiltin: true,

    isReadOnly() {
      return false;
    },

    async checkPermissions(): Promise<PermissionResult> {
      return { behavior: "allow" };
    },

    async call(input: unknown, context: ToolContext): Promise<ToolResult> {
      const { prompt, toolWhitelist } = input as z.infer<typeof inputSchema>;

      const model = (context as ToolContext & { model?: LanguageModel }).model;
      if (!model) {
        return {
          success: false,
          data: null,
          error: "spawn_agent requires `model` in ToolContext. The runtime should populate it.",
        };
      }

      if (activeCount >= MAX_CONCURRENT) {
        return {
          success: false,
          data: null,
          error: `Max concurrent sub-agents (${MAX_CONCURRENT}) reached. Wait for an existing one to finish.`,
        };
      }

      const agentId = crypto.randomUUID().slice(0, 8);
      const isolatedCwd = path.join(context.cwd, ".visagent", ".agents", agentId);
      try {
        fs.mkdirSync(isolatedCwd, { recursive: true });
      } catch (err) {
        return {
          success: false,
          data: null,
          error: `Failed to create sub-agent workdir: ${err instanceof Error ? err.message : String(err)}`,
        };
      }

      const filteredRegistry = filterRegistry(parent.registry, toolWhitelist);

      const subContext: ToolContext & { model: LanguageModel } = {
        sessionId: `subagent-${agentId}`,
        cwd: isolatedCwd,
        signal: context.signal,
        model,
      };

      activeCount++;
      try {
        const result = await parent.spawnSubAgent(filteredRegistry, {
          model,
          systemPrompt:
            `You are a Pokeshrimp sub-agent (id=${agentId}).\n` +
            `Focus only on the delegated task and report the outcome concisely.\n` +
            `Your working directory is isolated: ${isolatedCwd}\n` +
            `You cannot spawn further sub-agents.`,
          messages: [{ role: "user", content: prompt }],
          context: subContext,
        });
        return {
          success: true,
          data: { agentId, text: result.text, iterations: result.iterations },
        };
      } catch (err) {
        return {
          success: false,
          data: null,
          error: err instanceof Error ? err.message : String(err),
        };
      } finally {
        activeCount--;
        try {
          fs.rmSync(isolatedCwd, { recursive: true, force: true });
        } catch {
          // best-effort cleanup
        }
      }
    },
  };
}

// ─── Helpers ─────────────────────────────────────────────────

function filterRegistry(source: ToolRegistry, whitelist?: string[]): ToolRegistry {
  const filtered = new ToolRegistry();
  for (const tool of source.getAllTools()) {
    // Frozen rule: max nesting depth = 1.
    if (tool.name === "spawn_agent") continue;
    if (whitelist && whitelist.length > 0 && !whitelist.includes(tool.name)) {
      continue;
    }
    filtered.registerTool(tool);
  }
  return filtered;
}

// Re-export the iteration cap so callers can introspect it.
export { SUB_AGENT_MAX_ITERATIONS };
