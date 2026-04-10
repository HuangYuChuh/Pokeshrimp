import { streamText, type CoreTool, type LanguageModel, type CoreMessage } from "ai";
import type { ToolRegistry } from "@/core/tool/registry";
import type { ToolContext } from "@/core/tool/types";
import { bridgeToolsForAI } from "@/core/ai/tool-bridge";
import {
  type Middleware,
  runMiddlewaresBefore,
  runMiddlewaresAfter,
} from "./middleware";

// ─── Types ───────────────────────────────────────────────────

export interface AgentRuntimeConfig {
  model: LanguageModel;
  systemPrompt: string;
  registry: ToolRegistry;
  context: ToolContext;
  middlewares?: Middleware[];
  maxIterations?: number; // default 32
}

export interface AgentResult {
  text: string;
  iterations: number;
}

// ─── AgentRuntime ────────────────────────────────────────────

/**
 * The core agent loop. Frozen by design — all behavior changes
 * go through middlewares, not modifications to this function.
 *
 * Loop: messages → LLM → tool_use? → middleware → execute → continue
 */
export function createAgentTools(
  config: AgentRuntimeConfig,
): Record<string, CoreTool> {
  const { registry, context, middlewares = [] } = config;

  return bridgeToolsForAI(registry, context, {
    async onPreToolUse(toolName, input) {
      const result = await runMiddlewaresBefore(middlewares, toolName, input);
      return { allow: result.allowed, updatedInput: result.input };
    },
    async onPostToolUse(toolName, input, result) {
      await runMiddlewaresAfter(middlewares, toolName, input, result);
    },
  });
}

/**
 * Run the agent loop. Returns a streamable response for the API route.
 *
 * This is intentionally thin — it creates the streamText call with
 * middleware-wrapped tools. The Vercel AI SDK handles the actual
 * tool_use → execute → tool_result → continue loop via maxSteps.
 */
export function runAgent(
  config: AgentRuntimeConfig,
  messages: CoreMessage[],
  options?: {
    onFinish?: (result: { text: string }) => Promise<void>;
  },
) {
  const tools = createAgentTools(config);

  return streamText({
    model: config.model,
    system: config.systemPrompt,
    messages,
    tools,
    maxSteps: config.maxIterations ?? 32,
    onFinish: options?.onFinish,
  });
}
