import type { LanguageModel } from "ai";
import type { ToolRegistry } from "@/core/tool/registry";
import type { ToolContext } from "@/core/tool/types";
import type { Middleware } from "./middleware";
import { runAgent } from "./runtime";
import crypto from "crypto";
import path from "path";
import fs from "fs";

// ─── Types ───────────────────────────────────────────────────

export interface SubAgentConfig {
  model: LanguageModel;
  systemPrompt: string;
  registry: ToolRegistry;
  context: ToolContext;
  middlewares?: Middleware[];
  /** Tool names the sub-agent is allowed to use. Empty = all tools. */
  toolWhitelist?: string[];
  /** Max iterations (default 32) */
  maxIterations?: number;
}

export interface SubAgentResult {
  text: string;
  success: boolean;
  error?: string;
  agentId: string;
}

// ─── Constants ───────────────────────────────────────────────

const MAX_CONCURRENT = 3;

let activeCount = 0;

// ─── Sub-Agent ───────────────────────────────────────────────

/**
 * Spawn a sub-agent with fully isolated context.
 *
 * Isolation guarantees:
 * - Own conversation history (starts empty, only the task prompt)
 * - Own tool registry (filtered by whitelist, no spawn_agent)
 * - Own working directory (temp dir under parent's cwd)
 * - Own session ID (not shared with parent)
 * - Own system prompt (appended with sub-agent instructions)
 *
 * Frozen rules:
 * - Max concurrent: 3
 * - Max depth: 1 (sub-agents cannot spawn sub-agents)
 */
export async function spawnSubAgent(
  config: SubAgentConfig,
  prompt: string,
): Promise<SubAgentResult> {
  const agentId = crypto.randomUUID().slice(0, 8);

  if (activeCount >= MAX_CONCURRENT) {
    return {
      text: "",
      success: false,
      error: `Max concurrent sub-agents (${MAX_CONCURRENT}) reached.`,
      agentId,
    };
  }

  // Create isolated working directory
  const isolatedCwd = path.join(config.context.cwd, ".visagent", ".agents", agentId);
  fs.mkdirSync(isolatedCwd, { recursive: true });

  // Create isolated context — no shared state with parent
  const isolatedContext: ToolContext = {
    sessionId: `subagent-${agentId}`,
    cwd: isolatedCwd,
  };

  // Create filtered registry — no recursive spawning
  const filteredRegistry = createFilteredRegistry(
    config.registry,
    config.toolWhitelist,
  );

  activeCount++;

  try {
    let resultText = "";

    const stream = runAgent(
      {
        model: config.model,
        systemPrompt:
          config.systemPrompt +
          "\n\nYou are a sub-agent (ID: " + agentId + "). " +
          "Focus only on the delegated task. Be concise. " +
          "Your working directory is isolated — files you create won't affect other agents.",
        registry: filteredRegistry,
        context: isolatedContext,
        middlewares: config.middlewares,
        maxIterations: config.maxIterations ?? 32,
      },
      [{ role: "user" as const, content: prompt }],
      {
        async onFinish({ text }) {
          resultText = text;
        },
      },
    );

    // Consume the stream to completion
    for await (const _ of stream.textStream) {
      // drain
    }

    return { text: resultText, success: true, agentId };
  } catch (err) {
    return {
      text: "",
      success: false,
      error: err instanceof Error ? err.message : String(err),
      agentId,
    };
  } finally {
    activeCount--;
    // Clean up isolated directory
    try {
      fs.rmSync(isolatedCwd, { recursive: true, force: true });
    } catch {
      // best effort cleanup
    }
  }
}

// ─── Helpers ─────────────────────────────────────────────────

function createFilteredRegistry(
  source: ToolRegistry,
  whitelist?: string[],
): ToolRegistry {
  const { ToolRegistry: RegistryClass } = require("@/core/tool/registry");
  const filtered = new RegistryClass() as ToolRegistry;

  for (const tool of source.getAllTools()) {
    // Never allow sub-agents to spawn more sub-agents
    if (tool.name === "spawn_agent") continue;

    if (whitelist && whitelist.length > 0 && !whitelist.includes(tool.name)) {
      continue;
    }

    filtered.registerTool(tool);
  }

  return filtered;
}
