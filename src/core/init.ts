import path from "path";
import os from "os";
import { initProxySupport } from "@/core/proxy";
import { ToolRegistry } from "@/core/tool/registry";
import { registerBuiltinTools } from "@/core/tool/builtin";
import { createSpawnAgentTool } from "@/core/tool/builtin/spawn-agent";
import { getConfig } from "@/core/config/loader";
import { initAppState } from "@/core/state";
import {
  AgentRuntime,
  createSkillInjectionMiddleware,
  createCommandApprovalMiddleware,
  createHooksMiddleware,
  createLoopDetectionMiddleware,
  createContextCompactionMiddleware,
  type Middleware,
} from "@/core/agent";
import { listSkills } from "@/core/skill/engine";
import { getModel } from "@/core/ai/provider";
import { HooksEngine } from "@/core/hooks/engine";
import { loadHooks } from "@/core/hooks/loader";
import { MCPClientManager, registerMCPTools } from "@/core/mcp";
import type { AppConfig, McpServerConfig } from "@/core/config/schema";
import type { LanguageModel } from "ai";

let registry: ToolRegistry | null = null;
let runtime: AgentRuntime | null = null;
let runtimePromise: Promise<AgentRuntime> | null = null;
let mcpClientManager: MCPClientManager | null = null;

function getMCPClientManager(): MCPClientManager {
  if (!mcpClientManager) mcpClientManager = new MCPClientManager();
  return mcpClientManager;
}

/**
 * Lazy singleton — the tool registry is process-wide. Per-request
 * state (sessionId, cwd, signal, model) is passed via ToolContext to
 * AgentRuntime.run() and never lives on the registry.
 */
export function getToolRegistry(): ToolRegistry {
  if (!registry) {
    registry = new ToolRegistry();
    registerBuiltinTools(registry);
  }
  return registry;
}

/**
 * Connect configured MCP servers and register their tools in the
 * registry.  Failures are logged and swallowed — a broken MCP server
 * must never prevent the app from booting.
 */
async function connectMCPServers(
  servers: Record<string, McpServerConfig>,
  reg: ToolRegistry,
): Promise<void> {
  for (const [name, serverConfig] of Object.entries(servers)) {
    if (serverConfig.enabled === false) continue;
    try {
      await getMCPClientManager().connectServer(name, {
        command: serverConfig.command,
        args: serverConfig.args,
        env: serverConfig.env,
      });
    } catch (err) {
      console.warn(
        `[MCP] Failed to connect server "${name}", skipping:`,
        err instanceof Error ? err.message : err,
      );
    }
  }

  try {
    await registerMCPTools(getMCPClientManager(), reg);
  } catch (err) {
    console.warn("[MCP] Failed to register MCP tools:", err instanceof Error ? err.message : err);
  }
}

/**
 * Lazy singleton AgentRuntime. Constructed once per process with
 * the full middleware chain wired in. Sub-agent registration happens
 * here so that `spawn_agent` can close over the parent runtime.
 *
 * Async because MCP server connections happen at boot.
 */
export async function getRuntime(): Promise<AgentRuntime> {
  // Ensure proxy is configured before any API calls
  await initProxySupport();

  if (runtime) return runtime;

  // Deduplicate concurrent callers — only the first call does the
  // actual construction; subsequent callers await the same promise.
  if (!runtimePromise) {
    runtimePromise = (async () => {
      const reg = getToolRegistry();

      // Connect configured MCP servers and register their tools
      const config = getConfig();
      if (config.mcpServers && Object.keys(config.mcpServers).length > 0) {
        await connectMCPServers(config.mcpServers, reg);
      }

      const middlewares = buildMiddlewares();
      runtime = new AgentRuntime({
        registry: reg,
        middlewares,
        maxIterations: 32,
      });
      // spawn_agent needs a reference to its parent runtime, so it
      // must be registered after the runtime exists.
      reg.registerTool(createSpawnAgentTool(runtime));
      return runtime;
    })();
  }

  return runtimePromise;
}

function buildMiddlewares(): Middleware[] {
  const config = getConfig();
  const globalSkillsDir = path.join(os.homedir(), ".visagent", "skills");
  const projectSkillsDir = path.join(process.cwd(), ".visagent", "skills");
  const hooksDir = path.join(process.cwd(), ".visagent", "hooks");

  // Load user hook scripts from convention dir + config
  const hookEntries = loadHooks(config.hooks ?? {}, hooksDir);
  const hooksEngine = new HooksEngine(hookEntries);

  return [
    // Order matters — see docs/01 §3.2 + design doc.
    // 1. SkillInjection: enrich system prompt with available skills
    createSkillInjectionMiddleware(() => {
      const skills = listSkills(globalSkillsDir, projectSkillsDir);
      return skills.map((s) => ({
        name: s.name,
        command: s.command,
        description: s.description,
      }));
    }),
    // 2. CommandApproval: allow/deny/ask before any tool execution
    createCommandApprovalMiddleware({
      alwaysAllow: config.permissions?.alwaysAllow ?? [],
      alwaysDeny: config.permissions?.alwaysDeny ?? [],
      alwaysAsk: config.permissions?.alwaysAsk ?? [],
    }),
    // 3. Hooks: dispatch named events to user shell scripts
    createHooksMiddleware(hooksEngine),
    // 4. LoopDetection: safety net for repeated calls
    createLoopDetectionMiddleware(3),
    createContextCompactionMiddleware({
      maxCharBudget: 80_000,
      keepRecent: 8,
      // Resolve the summarizer model lazily: API keys may not be
      // present at boot (e.g. first-run desktop app before the user
      // pastes a key). Re-reading config on each compaction lets us
      // pick up keys added mid-session without restarting.
      summarizerModel: (): LanguageModel | undefined => {
        const cfg = getConfig();
        const anthropicKey = cfg.providers?.anthropic?.apiKey || process.env.ANTHROPIC_API_KEY;
        const openaiKey = cfg.providers?.openai?.apiKey || process.env.OPENAI_API_KEY;
        if (!anthropicKey && !openaiKey) return undefined;
        try {
          // Use whichever provider has a key configured.
          // Prefer a cheap model: Haiku if Anthropic key exists,
          // otherwise fall back to the cheapest OpenAI option.
          if (anthropicKey) {
            return getModel("anthropic:claude-haiku-4-5-20251001", cfg.providers);
          }
          if (openaiKey) {
            return getModel("openai:gpt-5.4-nano", cfg.providers);
          }
          return undefined;
        } catch {
          return undefined;
        }
      },
    }),
  ];
}

export async function initApp(): Promise<{
  registry: ToolRegistry;
  runtime: AgentRuntime;
  config: AppConfig;
}> {
  const config = getConfig();
  initAppState(config);
  const reg = getToolRegistry();
  const rt = await getRuntime();
  return { registry: reg, runtime: rt, config };
}

/** Disconnect all MCP servers. Call on app shutdown. */
export async function shutdown(): Promise<void> {
  if (mcpClientManager) await mcpClientManager.disconnectAll();
}

/** Reset the runtime/registry — useful for tests or after config reload. */
export async function resetRuntime(): Promise<void> {
  if (mcpClientManager) await mcpClientManager.disconnectAll();
  registry = null;
  runtime = null;
  runtimePromise = null;
}
