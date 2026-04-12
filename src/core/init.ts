import path from "path";
import os from "os";
import { ToolRegistry } from "@/core/tool/registry";
import { registerBuiltinTools } from "@/core/tool/builtin";
import { createSpawnAgentTool } from "@/core/tool/builtin/spawn-agent";
import { getConfig } from "@/core/config/loader";
import { initAppState } from "@/core/state";
import {
  AgentRuntime,
  createSkillInjectionMiddleware,
  createCommandApprovalMiddleware,
  createLoopDetectionMiddleware,
  createContextCompactionMiddleware,
  type Middleware,
} from "@/core/agent";
import { listSkills } from "@/core/skill/engine";
import { getModel } from "@/core/ai/provider";
import type { AppConfig } from "@/core/config/schema";
import type { LanguageModel } from "ai";

let registry: ToolRegistry | null = null;
let runtime: AgentRuntime | null = null;

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
 * Lazy singleton AgentRuntime. Constructed once per process with
 * the full middleware chain wired in. Sub-agent registration happens
 * here so that `spawn_agent` can close over the parent runtime.
 */
export function getRuntime(): AgentRuntime {
  if (!runtime) {
    const reg = getToolRegistry();
    const middlewares = buildMiddlewares();
    runtime = new AgentRuntime({
      registry: reg,
      middlewares,
      maxIterations: 32,
    });
    // spawn_agent needs a reference to its parent runtime, so it
    // must be registered after the runtime exists.
    reg.registerTool(createSpawnAgentTool(runtime));
  }
  return runtime;
}

function buildMiddlewares(): Middleware[] {
  const config = getConfig();
  const globalSkillsDir = path.join(os.homedir(), ".visagent", "skills");
  const projectSkillsDir = path.join(process.cwd(), ".visagent", "skills");

  return [
    // Order matters — see docs/01 §3.2.
    createSkillInjectionMiddleware(() => {
      const skills = listSkills(globalSkillsDir, projectSkillsDir);
      return skills.map((s) => ({
        name: s.name,
        command: s.command,
        description: s.description,
      }));
    }),
    createCommandApprovalMiddleware({
      alwaysAllow: config.permissions?.alwaysAllow ?? [],
      alwaysDeny: config.permissions?.alwaysDeny ?? [],
      alwaysAsk: config.permissions?.alwaysAsk ?? [],
    }),
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
        const anthropicKey =
          cfg.apiKeys?.anthropic || process.env.ANTHROPIC_API_KEY;
        const openaiKey = cfg.apiKeys?.openai || process.env.OPENAI_API_KEY;
        if (!anthropicKey && !openaiKey) return undefined;
        try {
          // Prefer the cheap/fast Haiku tier for summarization.
          return getModel("claude-haiku", {
            anthropic: cfg.apiKeys?.anthropic,
            openai: cfg.apiKeys?.openai,
          });
        } catch {
          return undefined;
        }
      },
    }),
  ];
}

export function initApp(): {
  registry: ToolRegistry;
  runtime: AgentRuntime;
  config: AppConfig;
} {
  const config = getConfig();
  initAppState(config);
  const reg = getToolRegistry();
  const rt = getRuntime();
  return { registry: reg, runtime: rt, config };
}

/** Reset the runtime/registry — useful for tests or after config reload. */
export function resetRuntime(): void {
  registry = null;
  runtime = null;
}
