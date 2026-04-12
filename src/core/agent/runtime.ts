import {
  streamText,
  tool as aiTool,
  type CoreMessage,
  type CoreTool,
  type LanguageModel,
  type StreamTextResult,
  type ToolSet,
} from "ai";
import type { ToolRegistry } from "@/core/tool/registry";
import type { ToolContext } from "@/core/tool/types";
import { executeTool } from "@/core/tool/executor";
import {
  type Middleware,
  applyConversationStartMiddlewares,
  applyBeforeLLMMiddlewares,
  runMiddlewaresBefore,
  runMiddlewaresAfter,
  runOnRunCompleteMiddlewares,
} from "./middleware";

// ─── Types ───────────────────────────────────────────────────

export interface AgentRuntimeOptions {
  registry: ToolRegistry;
  middlewares?: Middleware[];
  /** Maximum number of LLM iterations in a single run(). Default 32. */
  maxIterations?: number;
}

export interface AgentRunOptions {
  model: LanguageModel;
  systemPrompt: string;
  messages: CoreMessage[];
  context: ToolContext;
  /**
   * Called once per LLM iteration with the live streamText result.
   * The caller can call `stream.mergeIntoDataStream(dataStream)` to
   * forward text deltas, tool calls, and tool results to a client.
   */
  onIterationStream?: (
    stream: StreamTextResult<ToolSet, never>,
  ) => void | Promise<void>;
}

export interface AgentRunResult {
  text: string;
  iterations: number;
  messages: CoreMessage[];
}

const DEFAULT_MAX_ITERATIONS = 32;

// ─── AgentRuntime ────────────────────────────────────────────

/**
 * The single agent loop. Per docs/01 §3.1 §六.2:
 *
 *   loop: messages → LLM → tool_use? → middleware → execute → continue
 *
 * Frozen rules:
 * - There is only one Agent loop in the system: AgentRuntime.run().
 * - Never add business logic inside the loop. All extensions must
 *   go through middlewares.
 * - The core run() method stays under 100 lines.
 *
 * Tool execution flows through AI SDK's `execute` callback so that
 * text deltas / tool calls / tool results stream naturally to the
 * client. The loop itself is owned and driven explicitly here, with
 * `maxSteps: 1` keeping each LLM call to a single step before
 * control returns to the while loop.
 */
export class AgentRuntime {
  readonly registry: ToolRegistry;
  readonly middlewares: Middleware[];
  readonly maxIterations: number;

  constructor(options: AgentRuntimeOptions) {
    this.registry = options.registry;
    this.middlewares = options.middlewares ?? [];
    this.maxIterations = options.maxIterations ?? DEFAULT_MAX_ITERATIONS;
  }

  async run(opts: AgentRunOptions): Promise<AgentRunResult> {
    const start = await applyConversationStartMiddlewares(this.middlewares, {
      systemPrompt: opts.systemPrompt,
      messages: [...opts.messages],
    });
    let systemPrompt = start.systemPrompt;
    let messages = start.messages;

    // Enrich context with the current model so tools that need to
    // start a new LLM call (spawn_agent, summarizers, etc.) can reuse it.
    const enrichedContext: ToolContext = {
      ...opts.context,
      model: opts.model,
    };
    const tools = this.bridgeTools(enrichedContext);
    let iterations = 0;
    let lastText = "";

    while (iterations < this.maxIterations) {
      iterations++;
      messages = await applyBeforeLLMMiddlewares(this.middlewares, messages);

      const stream = streamText({
        model: opts.model,
        system: systemPrompt,
        messages,
        tools,
        maxSteps: 1,
      });

      // Hand the live stream to the caller so it can forward to the client.
      await opts.onIterationStream?.(stream);

      // Drain — these resolve once the underlying stream completes.
      const text = await stream.text;
      const toolCalls = await stream.toolCalls;
      const toolResults = await stream.toolResults;

      lastText = text;
      messages.push({
        role: "assistant",
        content: assembleAssistantContent(text, toolCalls),
      });

      if (!toolCalls || toolCalls.length === 0) break;

      // toolResults is typed as `never[]` here because we pass tools as
      // a loose Record<string, CoreTool> (no compile-time tool name list).
      // At runtime each entry is { toolCallId, toolName, result } from AI SDK.
      const typedResults = toolResults as Array<{
        toolCallId: string;
        toolName: string;
        result: unknown;
      }>;
      messages.push({
        role: "tool",
        content: typedResults.map((r) => ({
          type: "tool-result" as const,
          toolCallId: r.toolCallId,
          toolName: r.toolName,
          result: r.result,
        })),
      });
    }

    await runOnRunCompleteMiddlewares(this.middlewares, {
      sessionId: opts.context.sessionId,
      iterations,
      cwd: opts.context.cwd,
    });

    return { text: lastText, iterations, messages };
  }

  /**
   * Spawn an isolated child runtime — see docs/01 §3.5.
   * The child reuses the parent's middleware chain but receives a
   * filtered tool registry (typically with `spawn_agent` removed to
   * enforce max nesting depth = 1).
   */
  spawnSubAgent(
    filteredRegistry: ToolRegistry,
    runOpts: AgentRunOptions,
  ): Promise<AgentRunResult> {
    const sub = new AgentRuntime({
      registry: filteredRegistry,
      middlewares: this.middlewares,
      maxIterations: this.maxIterations,
    });
    return sub.run(runOpts);
  }

  /**
   * Wrap every tool in the registry with an AI SDK `execute` callback
   * that runs the middleware chain around the real tool invocation.
   * The runtime owns the loop; AI SDK owns streaming.
   */
  private bridgeTools(context: ToolContext): Record<string, CoreTool> {
    const out: Record<string, CoreTool> = {};
    for (const t of this.registry.getAllTools()) {
      out[t.name] = aiTool({
        description: t.description,
        parameters: t.inputSchema,
        execute: async (input) => {
          const before = await runMiddlewaresBefore(
            this.middlewares,
            t.name,
            input,
            context,
          );
          if (!before.allowed) {
            return `Error: ${before.reason ?? "Denied by middleware"}`;
          }
          const result = await executeTool(
            this.registry,
            t.name,
            before.input,
            context,
          );
          await runMiddlewaresAfter(
            this.middlewares,
            t.name,
            before.input,
            result,
          );
          if (!result.success) {
            return `Error: ${result.error ?? "unknown"}`;
          }
          return typeof result.data === "string"
            ? result.data
            : JSON.stringify(result.data, null, 2);
        },
      });
    }
    return out;
  }
}

// ─── Helpers ─────────────────────────────────────────────────

type ToolCallSummary = {
  toolCallId: string;
  toolName: string;
  args: unknown;
};

function assembleAssistantContent(
  text: string,
  toolCalls: ToolCallSummary[] | undefined,
):
  | string
  | Array<
      | { type: "text"; text: string }
      | {
          type: "tool-call";
          toolCallId: string;
          toolName: string;
          args: unknown;
        }
    > {
  if (!toolCalls || toolCalls.length === 0) return text;
  const parts: Array<
    | { type: "text"; text: string }
    | {
        type: "tool-call";
        toolCallId: string;
        toolName: string;
        args: unknown;
      }
  > = [];
  if (text) parts.push({ type: "text", text });
  for (const call of toolCalls) {
    parts.push({
      type: "tool-call",
      toolCallId: call.toolCallId,
      toolName: call.toolName,
      args: call.args,
    });
  }
  return parts;
}
