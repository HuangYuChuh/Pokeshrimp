import type { LanguageModel } from "ai";
import type { ToolRegistry } from "@/core/tool/registry";
import type { ToolContext } from "@/core/tool/types";
import type { Middleware } from "./middleware";
import { runAgent } from "./runtime";

// ─── Types ───────────────────────────────────────────────────

export interface SubAgentConfig {
  model: LanguageModel;
  systemPrompt: string;
  registry: ToolRegistry;
  context: ToolContext;
  middlewares?: Middleware[];
  /** Tool names the sub-agent is allowed to use. If empty, all tools are available. */
  toolWhitelist?: string[];
  /** Max iterations for the sub-agent (default 32) */
  maxIterations?: number;
}

export interface SubAgentResult {
  text: string;
  success: boolean;
  error?: string;
}

// ─── Constants ───────────────────────────────────────────────

const MAX_CONCURRENT = 3;
const MAX_DEPTH = 1; // sub-agents cannot spawn sub-agents

let activeCount = 0;

// ─── Sub-Agent ───────────────────────────────────────────────

/**
 * Spawn a sub-agent to handle a task. The sub-agent uses the same
 * AgentRuntime but with a filtered tool set.
 *
 * Rules (frozen):
 * - Max concurrent sub-agents: 3
 * - Max nesting depth: 1 (no recursive spawning)
 * - Sub-agents cannot use spawn_agent tool
 */
export async function spawnSubAgent(
  config: SubAgentConfig,
  prompt: string,
): Promise<SubAgentResult> {
  if (activeCount >= MAX_CONCURRENT) {
    return {
      text: "",
      success: false,
      error: `Max concurrent sub-agents (${MAX_CONCURRENT}) reached. Wait for others to finish.`,
    };
  }

  // Create a filtered registry
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
        systemPrompt: config.systemPrompt + "\n\nYou are a sub-agent. Focus only on the delegated task. Be concise.",
        registry: filteredRegistry,
        context: config.context,
        middlewares: config.middlewares,
        maxIterations: config.maxIterations ?? 32,
      },
      [{ role: "user", content: prompt }],
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

    return { text: resultText, success: true };
  } catch (err) {
    return {
      text: "",
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  } finally {
    activeCount--;
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

    // Apply whitelist if provided
    if (whitelist && whitelist.length > 0 && !whitelist.includes(tool.name)) {
      continue;
    }

    filtered.registerTool(tool);
  }

  return filtered;
}
